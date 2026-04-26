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
    <div className="apps-interface" style={{ padding: "30px" }}>
      <h3 className="title" style={{ marginBottom: "25px", fontSize: "20px" }}>External Apps</h3>

      <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", 
          gap: "25px" 
        }}
      >
        {partnerApps.map((app, index) => (
          <div 
            key={index} 
            className="app-item"
            style={{
              border: "1px solid #f1f1f1",
              borderRadius: "4px",
              padding: "20px",
              textAlign: "center",
              cursor: "pointer"
            }}
          >
            <img 
              src={app.img} 
              alt={app.name} 
              style={{ height: "35px", marginBottom: "12px",objectFit: "contain",width:"180px"}} 
            />
            <h5 style={{ margin: "5px 0", color: "#444" }}>{app.name}</h5>
            <p style={{ fontSize: "11px", color: "#999" }}>{app.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Apps;