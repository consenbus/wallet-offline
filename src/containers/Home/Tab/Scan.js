import React, { Component } from "react";
import { Redirect } from "react-router-dom";
import QrReader from "react-qr-reader";
import Layout from "../_Layout";
import Header from "./_Header";

class Scan extends Component {
  state = {
    error: null,
    success: false,
    delay: 300,
    result: "No result"
  };

  handleScan = data => {
    if (data) {
      const i = data.indexOf("bus_");
      this.setState({
        result: data,
        success: i !== -1
      });
    }
  };

  handleError = err => {
    console.error(err);
  };

  render() {
    const { result, success, error } = this.state;
    if (success) {
      return <Redirect to={`/tab/send?to=${result}`} />;
    }

    return (
      <Layout active="scan">
        <Header title="Scan QR code" />

        <div style={{ textAlign: "center" }}>
          <div>
            <QrReader
              delay={this.state.delay}
              onError={this.handleError}
              onScan={this.handleScan}
              style={{ width: "75%", margin: "auto" }}
            />
          </div>
          {error && <p>{error.message}</p>}
          <p>{result}</p>
        </div>
      </Layout>
    );
  }
}

export default Scan;
