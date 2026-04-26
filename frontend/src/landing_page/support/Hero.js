import React from "react";

function Hero() {
  return (
    <section className="container-fluid" id="supportHero">
      {/* TOP BAR */}
      <div
        className="d-flex justify-content-between align-items-center px-5 py-4"
        id="supportWrapper"
      >
        <h4>Support Portal</h4>
        <a href="#!">Track Tickets</a>
      </div>

      {/* MAIN CONTENT */}
      <div className="row px-5 py-4 g-4">
        {/* LEFT */}
        <div className="col-md-6 p-3">
          <h1 className="fs-4" style={{ maxWidth: "80%", lineHeight: "1.5" }}>
            Search for an answer or browse help topics to create a ticket
          </h1>

          <input
            type="text"
            placeholder="Eg. how do I activate F&O, why is my order getting rejected"
            style={{
              width: "75%",
              padding: "10px 14px",
              borderRadius: "6px",
              border: "none",
              marginTop: "15px",
            }}
          />

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "20px",
              marginTop: "15px",
              maxWidth: "75%",
            }}
          >
            <a href="#!">Track account opening</a>
            <a href="#!">Track segment activation</a>
            <a href="#!">Intraday margins</a>
            <a href="#!">Kite user manual</a>
          </div>
        </div>

        {/* RIGHT */}
        <div className="col-md-5 p-3 mt-4">
          <h1 className="fs-4">Featured</h1>

          <ol style={{ lineHeight: "2", marginTop: "10px" }}>
            <li>
              <a href="#!">Current Takeovers and Delisting - January 2024</a>
            </li>
            <li>
              <a href="#!">Latest Intraday leverages - MIS & CO</a>
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}

export default Hero;
