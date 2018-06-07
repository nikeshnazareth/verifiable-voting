// This was generated with openssl and will be used to check cryptographic operations
export const MOCK_BLINDING = {
  public_key: {
    modulus: '0x00b289e77666a62fd49faaae0a8dff9bedd418917956115c240bea58497259fcc9375c8718e75c7f2c1de37de3ad67635cd8b6e1fdc05e60ae34f8ef853f666cc8c269c6caf386c4dbd3bf19e47d6169210b353a10218e132ea688176ffb8039379a67f446809f8383496446c01ea4e0bec270fd1dfcc2ad719e4ddfa8bb40edda07a504a32f244452db7db969d14c75ab879bd172bb8edf1c8a7faeaff74326c296883542daac364a15b934cb95211a97384481d7c9c4b2c0e44481159a49fd340730fb991a0e3dbdf5efb0a788038b5cb9f354e1d502bdf63e394171ea1e9c04be611cf30200d8ed8f7e067b19aa662c357e4dcc1be7ae16267d30810b4e15c9',
    public_exp: '0x10001'
  },
  private_exp: '0x00a7c1921e1b676dabe076d45f907b2b7d757bbc3d01550079d24458be72570181e3a5ea3ec92d8d44dbb4a4d62859ebf012a50c858c9a61476ef8b4be440b2e8e18b6a1169369ff50fa8e267b1e204852c72035357101f91e2d55d487e10de3354ebcfcb6be26a3c0d9560270849ab19e2c3f546637d8887628a3cd52d2d7b86441bd3f261bdc872139845eacb6fc3b6be45f4d6f660a4849920aa2d6dc07e4f03239995bcdfdda46ee80093bdd870c147d14b00a6995f5b556e75dc0a100e866b68773207b520fbb815a71b3fc4cb9bcde546c2a5e4f414220a02e4f7611d949e9ac3aac84735d057c43dc0349b543646762838b5549b751dcd629e87ca8b4dd',
  message: {
    plain: 'MOCK_MESSAGE_TO_BE_BLINDED',
    hash: '0xed265d498b95710563dcd0bc85562d38988fb689fcea5a1cc59e6effbee6187f' // calculated using web3.sha3
  },
  factor: {
    plain: 'MOCK_BLINDING_FACTOR',
    hash: '0xeb256f1dbd22ce1930221279c41979e9f25858d9061cc3fd577961655fe676a7' // calculated using web3.sha3
  },
  // the following values were calculated directly from the above parameters with the python interpreter
  blinded_message: '0x18fdcb992df93319376f2a3c72957467cf720736e7686ad0b153f28ce168cb50e6c66e82b7757fc7d408a4ace64e3ee6e73b1dc5a7e3a8c7f9e74ecba59169a4e6658723819c7425368e32d0d11456b932a72f6a16bd73abdb91c9dfae5f44ebb8c96a0fdce4687026dc6dfa7a2c8e91631cb1e831776057eeea03cad9f0908e5f2030e8cf11e0a0f8729f520ace04dd7d991f16125f0007bc16ebf6deb9f0a430c23f179e43e2314d6d539f52154eb9ab2e079c8d35524e7b78bfe144a477ab6bb5a460f52c4a27ba5f694cb8dbf0325fe95cb3f0a6e6e7707ad0268f867d95544b9ba90f58bcb1c610e22d88664031c1ce47dc3e0bccde4b51a7e2f9201b1c',
  signed_blinded_message: '0x3a2cd5dfcf16d280c002172d383056991c5a2e65cb57cba8b839ebb2aa0d52fb248bf15ed6dd41312b392db2290330620bfc9b4d3b1d676399c46e1b509aa3ae50c0fcc2ab28532aed50cdf5e87f8c7dfaf1b101f3d1524e5ed50ca309a4084b17c60df61e9c4f52889ae5909f8d99a76e42395b6fd1d98fd481e35012ddeb662166b52b7caad06a28b1d3c6b85f41eeb242cafbe0c9354e41dad95ec1eb7453f0b3070a930d21d60880d1cfd11f8b75fc5a0ef7f90a2cf4430d5b55aea28a301f743ad405c113fa1a0eb5cd2048b24c53b81eab679e7c4b900afb7725d0ce393d7d040f142cf57064c15d33b79264adf55b939cf8bac1f684817976f9aa79a4',
  signed_unblinded_message: '0xd26cd2d51dce8e08b76949c60e39f00a30a73fcb758375b8ba55a223493038e995cf1adc1c60588acb37f6aa2b99ad04d4e1f3fcba5130564593911c9c64cd7a3edd88929a40eb78f2c97d30a77a0926db66e37fa8dfd757850c4e715fdac3d0eb2bf13524b5cb549bcf02f94aa7981b5f2d72897e56c6fbdb2d38db6b34a741e705c47dda47c04553c09ee1a4a28018761bafe8946cc364fab81956225afe661f138a16c5ded9faddc85c16b4acb057ce49e79373224b37dfc0a527abc84f591ffb604699fabba1ea6e0a4a2ccfe13cabaeace22bf7834a0465b7e8874d1f7994dce2810884a9d51fe152495d6dac4ac138f5b8671507d74d28872f10618c3'
};