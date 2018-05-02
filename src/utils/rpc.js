import axios from 'axios';
import retry from 'async/retry';

let enabledBaseURLIndex = 0;
const baseURLs = [
  'http://localhost:55000',
  'http://140.143.247.112:55000',
];

const post = (uri, body) => {
  const { length } = baseURLs;
  let baseURLIndex = enabledBaseURLIndex;
  return new Promise((resolve, reject) => {
    retry(length, (callback) => {
      const root = baseURLs[baseURLIndex % length];
      const url = `${root}${uri}`;
      console.log(url);
      axios
        .post(url, body)
        .then((resp) => {
          enabledBaseURLIndex = baseURLIndex;
          callback(null, resp);
        })
        .catch((error) => {
          console.log('fuck you', baseURLIndex);
          baseURLIndex += 1;
          callback(error);
        });
    }, (error, resp) => {
      if (error) {
        if (error.response) {
          return resolve(error.response);
        }
        return reject(error);
      }
      return resolve(resp);
    });
  });
};

const rpc = { post };

export default rpc;
