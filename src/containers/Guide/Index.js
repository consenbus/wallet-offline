import React, { Component } from "react";
import { Link } from "react-router-dom";
import Button from "material-ui/Button";
import Typography from "material-ui/Typography";
import teal from "material-ui/colors/teal";

import Layout from "./_Layout";
import logo from "../../assets/img/logo-white.svg";

class Index extends Component {
  render() {
    return (
      <Layout>
        <img
          alt="logo"
          src={logo}
          style={{
            marginTop: "5rem",
            width: "150px",
            height: "auto"
          }}
        />

        <div style={{ marginTop: "5rem" }}>
          <Typography variant="title" color="inherit">
            CONSENBUS
          </Typography>
          <p style={{ marginTop: "1rem" }}>
            <span>Take control of your money,</span>
            <br />
            <span>get started with consenbus.</span>
          </p>
        </div>

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
            to="/guide/tooltips"
            style={{
              color: "white",
              backgroundColor: teal.A700
            }}
          >
            Generate new wallet
          </Button>

          <Link
            href="/guide/restore"
            to="/guide/restore"
            style={{ color: "white", lineHeight: "50px" }}
          >
            Restore from backup
          </Link>
        </div>
      </Layout>
    );
  }
}

export default Index;
