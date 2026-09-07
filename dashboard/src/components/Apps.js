import React from "react";

const Apps = () => {
  const partnerApps = [
    { name: "smallcase", desc: "Thematic investing", img: "media/images/smallcaseLogo.png" },
    { name: "Streak", desc: "Algo & strategy", img: "media/images/streakLogo.png" },
    { name: "Sensibull", desc: "Options trading", img: "media/images/sensibullLogo.svg" },
    { name: "Fund House", desc: "Asset management", img: "media/images/zerodhaFundhouse.png" },
    { name: "GoldenPi", desc: "Bonds trading", img: "media/images/goldenpiLogo.png" },
    { name: "Ditto", desc: "Insurance", img: "media/images/dittoLogo.png" },
  ];

  return (
    <div className="apps-interface">
      <h3 className="title">External Apps</h3>

      <div className="apps-grid">
        {partnerApps.map((app, index) => (
          <div key={index} className="app-item">
            <img src={app.img} alt={app.name} />
            <h5>{app.name}</h5>
            <p>{app.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Apps;