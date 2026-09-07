import React, { useState, useEffect } from "react";
import axios from "axios";
import BuyActionWindow from "./BuyActionWindow";
import SellActionWindow from "./SellActionWindow";
import ChartWindow from "./ChartWindow";

const GeneralContext = React.createContext({
  openBuyWindow: (stock) => {},
  openSellWindow: (stock) => {},
  openChartWindow: (stock) => {},
  closeWindow: () => {},
  refreshFlag: 0,
  triggerRefresh: () => {},
});

export const GeneralContextProvider = (props) => {
  const [isBuyWindowOpen, setIsBuyWindowOpen] = useState(false);
  const [isSellWindowOpen, setIsSellWindowOpen] = useState(false);
  const [isChartWindowOpen, setIsChartWindowOpen] = useState(false);
  const [selectedStockUID, setSelectedStockUID] = useState(null);
  const [allHoldings, setAllHoldings] = useState([]);
  const [refreshFlag, setRefreshFlag] = useState(0);

  const triggerRefresh = () => setRefreshFlag(prev => prev + 1);

  // Fetch holdings 
  useEffect(() => {
    axios.get(`${process.env.REACT_APP_BACKEND_URL}/allHoldings`).then((res) => {
      setAllHoldings(res.data);
    });
  }, [isSellWindowOpen]); // Refresh when window opens

  const handleOpenBuyWindow = (stock) => {
    setIsBuyWindowOpen(true);
    setSelectedStockUID(stock);
  };

  const handleOpenSellWindow = (stock) => {
    setIsSellWindowOpen(true);
    setSelectedStockUID(stock);
  };

  const handleOpenChartWindow = (stock) => {
    setIsChartWindowOpen(true);
    setSelectedStockUID(stock);
  };

  const handleCloseWindow = () => {
    setIsBuyWindowOpen(false);
    setIsSellWindowOpen(false);
    setIsChartWindowOpen(false);
    setSelectedStockUID(null);
  };

  return (
    <GeneralContext.Provider
      value={{
        openBuyWindow: handleOpenBuyWindow,
        openSellWindow: handleOpenSellWindow,
        openChartWindow: handleOpenChartWindow,
        closeWindow: handleCloseWindow,
        refreshFlag,
        triggerRefresh,
      }}
    >
      {props.children}
      {isBuyWindowOpen && <BuyActionWindow stock={selectedStockUID} />}

      {/* pass holdings data here */}
      {isSellWindowOpen && (
        <SellActionWindow stock={selectedStockUID} holdings={allHoldings} />
      )}

      {isChartWindowOpen && <ChartWindow stock={selectedStockUID} />}
    </GeneralContext.Provider>
  );
};

export default GeneralContext;
