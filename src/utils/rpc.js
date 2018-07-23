import axios from "axios";
import retry from "async/retry";

let enabledBaseURLIndex = 0;
// const baseURLs = ["http://127.0.0.1:7076"];

/* production */
const baseURLs = [
  "http://node.consenbus.org:7076",
  "http://node-cn-1.consenbus.org:7076",
  "http://node-kr-1.consenbus.org:7076",
  "http://node-us-1.consenbus.org:7076"
];

const post = (uri, body) => {
  const { length } = baseURLs;
  let baseURLIndex = enabledBaseURLIndex;
  return new Promise((resolve, reject) => {
    retry(
      length,
      callback => {
        const root = baseURLs[baseURLIndex % length];
        const url = `${root}${uri}`;
        axios
          .post(url, body)
          .then(resp => {
            enabledBaseURLIndex = baseURLIndex;
            callback(null, resp);
          })
          .catch(error => {
            baseURLIndex += 1;
            callback(error);
          });
      },
      (error, resp) => {
        if (error) {
          if (error.response) {
            return resolve(error.response);
          }
          return reject(error);
        }
        return resolve(resp);
      }
    );
  });
};

const rpc = { post };

export default rpc;
