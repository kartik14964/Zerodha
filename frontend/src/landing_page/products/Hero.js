import React from "react";

function Hero() {
  return (
    <div className="container border-bottom mb-5">
      <div className="row text-center mt-5 p-5">
        <h1>Technology</h1>
        <h3 className="text-muted mt-3 fd-4">
          Sleek, modern and intuitive trading platforms
        </h3>
        <p className="mt-3 mb-5">
          check out our {" "}
          <a href="" style={{ textDecoration: "none" }}>
            investment offerings<i class="fa-solid fa-arrow-right-long"></i>
          </a>
        </p>
      </div>
    </div>
  );
}

export default Hero;
