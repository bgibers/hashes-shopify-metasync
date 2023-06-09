import { useAppBridge } from '@shopify/app-bridge-react';
import { Redirect } from '@shopify/app-bridge/actions';
import {
  Layout,
  LegacyCard,
  Button,
  Link,
  ResourceList,
  Page,
  TextField,
  Modal,
} from '@shopify/polaris';
import { navigate } from 'raviger';
import React, { useEffect, useState } from 'react';
import useFetch from '../../hooks/useFetch';

const BurnEvents = () => {
  const app = useAppBridge();
  const redirect = Redirect.create(app);
  const [responseData, setResponseData] = useState([]);
  const [responseDataRefresh, setResponseDataRefresh] = useState('');
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const fetch = useFetch();

  async function fetchContent() {
    try {
      const res = await fetch('admin/burns', {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        method: 'GET',
      });
      const json = await res.json();
      setResponseData(json);
    } catch (error) {
      console.error(error);
    }
  }

  async function fetchContentPost() {
    try {
      const res = await fetch('/admin/refresh_burns/');
      const json = await res.json();

      if (json.message) {
        setResponseDataRefresh(json.message);
      } else {
        setResponseDataRefresh(json.error);
      }

      fetchContent();
      setIsPopupOpen(true);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    fetchContent();
  }, []);

  const rows = responseData.map((item) => ({
    id: item._id,
    orderNumber: item.orderNumber,
    burnContractAddress: item.burnContractAddress,
    burnedTokenId: item.burnedTokenId,
    claimTx: item.claimTx,
    redeemContractAddress: item.redeemContractAddress,
    redeemedTokenId: item.redeemedTokenId,
  }));

  const renderContent = () => {
    if (rows.length === 0) {
      return <p>No burns have been performed.</p>;
    }
    return (
      <ResourceList
        resourceName={{ singular: 'burn event', plural: 'burn events' }}
        items={rows}
        renderItem={(item) => {
          const {
            id,
            orderNumber,
            redeemContractAddress,
            burnContractAddress,
            burnedTokenId,
            claimTx,
            redeemedTokenId,
          } = item;
          return (
            <ResourceList.Item id={id}>
              <h3>Order: {orderNumber}</h3>
              <div>Redeem Contract Address: {redeemContractAddress}</div>
              <div>Redeemed token id: {redeemedTokenId}</div>
              <div>Burn Contract Address: {burnContractAddress}</div>
              <div>Burned token id: {burnedTokenId}</div>
              <div>Mint transaction: {claimTx}</div>
            </ResourceList.Item>
          );
        }}
      />
    );
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
    setResponseDataRefresh('');
  };

  return (
    <Page
      title="Burn Events"
      breadcrumbs={[{ content: 'Home', onAction: () => navigate('/admin') }]}
    >
      <Layout>
        <Layout.Section>
          <LegacyCard>
            <LegacyCard.Section>
              <Button primary onClick={fetchContentPost}>
                Refresh
              </Button>
            </LegacyCard.Section>
          </LegacyCard>
          <Modal
            open={isPopupOpen}
            onClose={handleClosePopup}
            title="Refresh Response"
            primaryAction={{
              content: 'OK',
              onAction: handleClosePopup,
            }}
          >
            <Modal.Section>
              <p>{responseDataRefresh}</p>
            </Modal.Section>
          </Modal>
          <LegacyCard>
            <LegacyCard.Section>{renderContent()}</LegacyCard.Section>
          </LegacyCard>
        </Layout.Section>
      </Layout>
    </Page>
  );
};

export default BurnEvents;
