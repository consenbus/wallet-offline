import React, { Component } from "react";
import { Link } from "react-router-dom";
import ErrorIcon from "material-ui-icons/Error";
import Button from "material-ui/Button";
import teal from "material-ui/colors/teal";
import ArrowDownwardIcon from "material-ui-icons/ArrowDownward";

import Layout from "./_Layout";

class Backup extends Component {
  render() {
    return (
      <Layout>
        <div style={{ marginTop: "30%" }}>
          <ErrorIcon
            style={{
              color: teal.A700,
              width: 100,
              height: 100
            }}
          />
        </div>

        <h2>No backup, no consenbus</h2>
        <p style={{ marginTop: "1rem" }}>
          Since only you control your money, you’ll need to save your backup
          phrase in case this app is deleted.
        </p>

        <div style={{ marginTop: "40%" }}>
          <ArrowDownwardIcon
            style={{
              color: teal.A700,
              width: 50,
              height: 50
            }}
          />
        </div>

        <p style={{ marginTop: "1rem" }}>
          WARNING: Write the mnemonic DOWN. If the mnemonic is lost, it will be
          IMPOSSIBLE to restore your ASSETS.
        </p>

        <div
          style={{
            position: "fixed",
            bottom: "0px",
            width: "90%",
            backgroundColor: "rgb(34, 82, 163)",
            maxWidth: "450px"
          }}
        >
          <Button
            variant="raised"
            color="secondary"
            size="large"
            fullWidth
            component={Link}
            to="/guide/backup-warning"
            style={{
              color: "white",
              backgroundColor: teal.A700
            }}
          >
            Backup wallet
          </Button>
          <Link to="/" style={{ color: "white", lineHeight: "50px" }}>
            Do it later
          </Link>
        </div>
      </Layout>
    );
  }
}

export default Backup;
