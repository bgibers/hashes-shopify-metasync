import fetch from 'node-fetch';

import OrderPaidModel from '../../utils/models/OrderPaidModel';
import TokenGateModel from '../../utils/models/TokenGateModel';

import {
  createMetadataForCollection,
  getMetadataByTokenId,
  updateMetadataForToken,
} from '../services/MetadataService';

/* 
  UPON CHECKOUT AND PAYMENT
    - Parse order details we need
    - Get contract address saved 
    - Add store of checkout/tokengate
    - Call metadata service to get current metadata
    - Update claimed status to true
    - Call OS API to force update metadata
  */
const orderPaidHandler = async (
  topic: string,
  shop: string,
  webhookRequestBody: string,
  webhookId: string
) => {
  const jsonReponse = JSON.parse(webhookRequestBody);
  const id = jsonReponse.id;
  const orderNumber = jsonReponse.order_number;

  jsonReponse?.line_items.forEach(async (item: any) => {
    const walletUsed = item.properties.find(
      (prop: any) => prop.name === '_wallet'
    )?.value;

    const tokenId = item.properties.find(
      (prop: any) => prop.name === 'Token ID'
    )?.value;

    const tokenGateId = item.properties.find(
      (prop: any) => prop.name === '_token_gate_id'
    )?.value;

    const productName = item.name.toLowerCase().trim();

    const tknGate = await TokenGateModel.findOne({
      productName: productName,
    });

    if (!tknGate) {
      console.error('Product name not found');
    } else {
      const contractAddress = tknGate.contractAddress;

      await OrderPaidModel.create({
        id,
        orderNumber,
        walletUsed,
        tokenId,
        tokenGateId,
        contractAddress,
      });

      await getMetadataByTokenId(contractAddress, tokenId).then(
        async (json: any) => {
          const existingAttribute = json.attributes.find(
            (attribute: any) => attribute.trait_type === 'Claimed'
          );

          if (existingAttribute) {
            existingAttribute.value = 'True';
          } else {
            json.attributes.push({
              trait_type: 'Claimed',
              value: 'True',
            });
          }

          await updateMetadataForToken(
            contractAddress,
            tokenId,
            JSON.stringify(json)
          )
            .then((result) => {
              console.log(
                `JSON data updated for ${contractAddress}-${tokenId}`
              );
            })
            .catch((error) => {
              console.error(
                `Couldn't update metadata for ${contractAddress}-${tokenId}: ${error}`
              );
            });
        }
      );
      await updateOSMetadata(contractAddress, tokenId);
    }
  });
};

async function updateOSMetadata(contractAddress: string, tokenId: Number) {
  const res = await fetch(
    `https://api.opensea.io/api/v1/asset/${contractAddress}/${tokenId}/?force_update=true`
  );
  await res.status;
}

export default orderPaidHandler;
