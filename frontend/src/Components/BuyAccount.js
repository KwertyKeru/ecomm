import Header from "./Header.js";
import React, { useState } from "react";
function BuyAccount() {
  const [showMore, setShowMore] = useState(false);
  const text =
    "It is necessary to have an active registered account and be logged in to complete any transaction. Please contact us if any help is necessary.";
  return (
    <>
      <Header />
      <div className="body">
        <div className="wrapper">
          <div className="main-title">
            <h1>10250RP</h1>
          </div>
          <div className="box a">
            <div className="content-wrapper">
              <div className="row product-info">
                <h6>Product info</h6>
              </div>
              <div className="row details">
                <h6>Details</h6>
              </div>
              <div className="row offer">
                <hr />
                <p>
                  This is 10250RP offer <br />
                  <p>
                    {showMore ? text : `${text.substring(0, 81)}`}
                    <button
                      className="btn-show-more"
                      onClick={() => setShowMore(!showMore)}
                    >
                      {showMore ? "Show less" : "Show more"}
                    </button>
                  </p>
                </p>
              </div>
            </div>
          </div>
          <div className="box b">
            <div className="content-wrapper">
              <div className="row buy">
                <h6>Buy details</h6>
                <hr />
              </div>
              <div className="row price">
                <div className="total price">
                  <h6>Total price</h6>
                </div>
                <div className="price count">
                  <h6>46 eur</h6>
                  <hr />
                </div>
              </div>
              <div className="row-btn">
                <button className="buy-btn">
                  <span>Buy now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default BuyAccount;