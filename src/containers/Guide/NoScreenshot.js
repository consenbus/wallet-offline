import React, { Component } from "react";
import { Link } from "react-router-dom";
import IconButton from "material-ui/IconButton";
import ButtonBase from "material-ui/ButtonBase";
import LeftIcon from "material-ui-icons/KeyboardArrowLeft";
import noScreenshotImage from "../../assets/img/backup/no-screenshot.svg";
import Layout from "./_Layout";

class NoScreenshot extends Component {
  render() {
    return (
      <Layout color="#bb331a" style={{ backgroundColor: "rgb(187, 51, 26)" }}>
        <p style={{ textAlign: "left" }}>
          <IconButton
            color="inherit"
            component={Link}
            to="/guide/backup-warning"
          >
            <LeftIcon />
          </IconButton>
        </p>

        <h2>Screenshots are not secure</h2>
        <p style={{ marginTop: "1rem", backgroundColor: "rgb(187, 51, 26)" }}>
          If you take a screenshot, your backup may be viewed by other apps. You
          can make a safe backup with physical paper and a pen
        </p>

        <div style={{ marginTop: "30%", backgroundColor: "rgb(187, 51, 26)" }}>
          <img
            alt=""
            src={noScreenshotImage}
            style={{
              marginTop: "5rem",
              width: "150px",
              height: "auto"
            }}
          />
        </div>

        <div
          style={{
            position: "fixed",
            bottom: "20px",
            width: "90%",
            backgroundColor: "rgb(187, 51, 26)",
            maxWidth: "450px"
          }}
        >
          <ButtonBase
            variant="raised"
            color="secondary"
            size="large"
            fullWidth
            component={Link}
            to="/guide/write-down"
            style={{
              color: "white",
              padding: "10px 20px",
              border: "2px solid white"
            }}
          >
            I understand
          </ButtonBase>
        </div>
      </Layout>
    );
  }
}

export default NoScreenshot;
