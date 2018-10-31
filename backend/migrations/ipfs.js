const axios = require('axios');

module.exports = (data) => {
    return axios({
        method: 'post',
        url: 'http://ipfs.nikeshnazareth.com:3000/add',
        data: {record: data}
    })
        .then(result => result.data.data)
        .catch(err => console.error(err.response.data));
};