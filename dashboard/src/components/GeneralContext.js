import React, { useState, useEffect } from "react";
import axios from "axios";
import BuyActionWindow from "./BuyActionWindow";
import SellActionWindow from "./SellActionWindow";

const GeneralContext = React.createContext({
  openBuyWindow: (stock) => {},
  openSellWindow: (stock) => {},
  closeWindow: () => {},
});

export const GeneralContextProvider = (props) => {
  const [isBuyWindowOpen, setIsBuyWindowOpen] = useState(false);
  const [isSellWindowOpen, setIsSellWindowOpen] = useState(false);
  const [selectedStockUID, setSelectedStockUID] = useState(null);
  const [allHoldings, setAllHoldings] = useState([]);

  // Fetch holdings 
  useEffect(() => {
    axios.get("https://zerodhabackend-3sw3.onrender.com/allHoldings").then((res) => {
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

  const handleCloseWindow = () => {
    setIsBuyWindowOpen(false);
    setIsSellWindowOpen(false);
    setSelectedStockUID(null);
  };

  return (
    <GeneralContext.Provider
      value={{
        openBuyWindow: handleOpenBuyWindow,
        openSellWindow: handleOpenSellWindow,
        closeWindow: handleCloseWindow,
      }}
    >
      {props.children}
      {isBuyWindowOpen && <BuyActionWindow stock={selectedStockUID} />}

      {/* pass holdings data here */}
      {isSellWindowOpen && (
        <SellActionWindow stock={selectedStockUID} holdings={allHoldings} />
      )}
    </GeneralContext.Provider>
  );
};

export default GeneralContext;
