const axios = require('axios');

module.exports = (data) => {
    return axios({
        method: 'post',
        url: 'https://ipfs.nikeshnazareth.com/add',
        data: {record: data}
    })
        .then(result => result.data.data)
        .catch(err => console.error(err.response.data));
};