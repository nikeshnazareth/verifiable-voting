const registrationAuthorities = [
    {
        "key": {
            "modulus": "0x00b289e77666a62fd49faaae0a8dff9bedd418917956115c240bea58497259fcc9375c8718e75c7f2c1de37de3ad67635cd8b6e1fdc05e60ae34f8ef853f666cc8c269c6caf386c4dbd3bf19e47d6169210b353a10218e132ea688176ffb8039379a67f446809f8383496446c01ea4e0bec270fd1dfcc2ad719e4ddfa8bb40edda07a504a32f244452db7db969d14c75ab879bd172bb8edf1c8a7faeaff74326c296883542daac364a15b934cb95211a97384481d7c9c4b2c0e44481159a49fd340730fb991a0e3dbdf5efb0a788038b5cb9f354e1d502bdf63e394171ea1e9c04be611cf30200d8ed8f7e067b19aa662c357e4dcc1be7ae16267d30810b4e15c9",
            "e": "0x10001",
            "d": "0x00a7c1921e1b676dabe076d45f907b2b7d757bbc3d01550079d24458be72570181e3a5ea3ec92d8d44dbb4a4d62859ebf012a50c858c9a61476ef8b4be440b2e8e18b6a1169369ff50fa8e267b1e204852c72035357101f91e2d55d487e10de3354ebcfcb6be26a3c0d9560270849ab19e2c3f546637d8887628a3cd52d2d7b86441bd3f261bdc872139845eacb6fc3b6be45f4d6f660a4849920aa2d6dc07e4f03239995bcdfdda46ee80093bdd870c147d14b00a6995f5b556e75dc0a100e866b68773207b520fbb815a71b3fc4cb9bcde546c2a5e4f414220a02e4f7611d949e9ac3aac84735d057c43dc0349b543646762838b5549b751dcd629e87ca8b4dd"
        },
        "address": "0x464e705725074cd37fa69dc21b4ba6c8ef02ea73"
    }
];

module.exports = [
    {
        "topic": "How many roads must a man walk down?",
        "candidates": ["Seven", "Eight", "Do I know what rhetorical means?"],
        "registration_authority": registrationAuthorities[0],
        "phase": 0,
    },
    {
        "topic": "Who will police the police?",
        "candidates": ["Super Troopers", "Police all the way down", "Coast Guard"],
        "registration_authority": registrationAuthorities[0],
        "phase": 1,
        "voters": [
            {
                "public": "0x8b31ab5e10db3dfe665f61d186662d746bb855a3",
                "anonymous": "0x8c2d711db825d9942e18c776895a646f1c73ca89",
                "blinding_factor": "Rjv+DoBYLvCf4DE5dIWXSB5xz/1E4xpwRdB21CAze1w8",
                "derivations": {
                    "blinded_address": "0xb127c649ab3ec3dd5be51c23df430c02a3558ce14a221f3ffcd4f0d6160bb3823a246193938f12c97b20597a14d8c8ec64465955bfed48db3513092c92b4befd5d0c4c8ff9cbbf486e95da958406acd95b708a2e23e7c1cfc6195ee45fabfdca282751779ce62f8addc2a538e02aacee9039db926207a113c81a80b9095da886a8e2e2bbcf07371e6a5f3a21b3111dfca57e19bfe3dfcf8f29ef558f39f2a9a6b19cad0ca9cd6cc056c93046b425e81405f2610b77f8bdf2d74887ce3bea709e1b66d53272728de39e82c47e9057ccbe42291ba0af6748932ba82fc651122a93dd8e327d60530db69afa0e26ec72ac8dbf2976b1286acc57c05c8f19635af524"
                }
            },
            {
                "public": "0x09cf1582761bd0e218fe065740eac6c90370affe",
                "anonymous": "0x7c460586573d72470d73c3f1ec62b87f0a703173",
                "blinding_factor": "jfBHdFqBa0hsl12CT/Cx3TmkYvlR2zd+eDSazixvbx5L",
                "derivations": {
                    "blinded_address": "0xab9dfaf063d02c2db0660b824ebad665525d14fc521f0a32f1f47af69f06a964794a8c3250e4dbd07273dab712c2cff20058f36ca25003992a143ec08de475f73518ca96ff1517c3fad39e6c84d86855eea0c3afad6262fac85d54a11ddb63b5854abde5c09d2bbf899358c3d5a1e763fcfeef5b4ae12630101274c3eb838c3c591797b3db70adf5aba8e1316fa3fac66b386cf956abce0a8435f8308cffdbd9ebfe2822261e8c22cfbe434cd7c35efe7661802a43ba45885fc80b8266cb4100600fedba4e3001ef53d0da73eb6577af7d9ec49e6da4fd121dcea0b9ce3c363bed124dbbc178d96a8ce325073f471a005a2afc6a5a62bc416ac3dde04ca526ce"
                }
            },
            {
                "public": "0x17db50ccb1a339cfa45caebe318f739554f04ec2",
                "anonymous": "0x953c451b9c2e62b21c4eb84a054880fcaee46343",
                "blinding_factor": "MeVavkXBu5iZYna4r91RZ28lWYUrNuO1WURVgA2Tb5lm",
                "derivations": {
                    "blinded_address": "0x6babc7778a74c6707e97d4ffc73f6e50267a64e1472bde2ccf1a4e467db39cfc76e152c3cdf2fc6306fafe47ba17587e890e556761bf65b1314d9703be4729985770f706498fcd5a6f3e979d44c77a51bd225685d7000c7c219171344d94bbac70fe1a2bd074278644bd5a3c5cfff5b6d2f61506506074e67cf176b6d11abf46a9e97ef4053294fe1841b845be5298923cd5a0e2a021ea00fe54382bb776d98fb156f91169c075fa91e1e5a26595799b90d0bb0991391e70eaff7f534b75ab68d8fcdb4ed89aa52ad95618afd3c8a4682cbb4b016e286c0597cea19a5f765e846d07b5aa5a358650dc31dae855f62a1b442c0c81522169a155a4d79e2b8e6aa0"
                }
            },
            {
                "public": "0x39d9880fd7a4abc5f2bf07a8e8aacc882441ac69",
                "anonymous": "0x19da0b08508c35757722e9ec75e9b9cdcaef9957",
                "blinding_factor": "1Z7hG2DMF+9jcU/tk7zoh6KFxCywzLKKawhjAdElYh72",
                "derivations": {
                    "blinded_address": "0x5160e4aa3bc62430d15bf163fedbe2c2e11cd26d091944add2b51ee3ac345e6ae64d365fbf9c716faacc77d18cee9e84dfd28a37157042b3000d6393eae959cf8f6a49b4fedb448c7a848272360367ade455571ef5d1659c2820d2ef3041031a2a8b1ac8ce77358ca15970bd1f5614793843747eb1e5d44a8282c33d282f2e3926ec47cc071a7fb1acb9f13a3f74419baa898a4e6533e61c9fd457b9025a9679ff8d5cff55e73fe72090ea850a8d09e6440efce512ebbee4c3a53153a598eaf4907337185aa5fc165491bc680e68464799a6697503c01591e2e4bbc2ce278bc1f7bc08fe28fef31ec1f243e36e78ba24d96a061cb5ca7447959fd9a0a8fb9123"
                }
            },
            {
                "public": "0x5a8805b2f8b1f1872510b9fa1d9b18c778c837f0",
                "anonymous": "0xd1894e9f7ccd3d9faf297166d3ceeb556f7772d1",
                "blinding_factor": "cHP5ccrCys7+qECfedkZwG5Afgz5fmVAvvJB8MeCEBg2",
                "derivations": {
                    "blinded_address": "0xe5fa5b9f7479dad19ef4882b35f26f36232a49b70799035163d6bd25966df660122584d35a84f760a87c6ae67e939002f9e1870104e8f61c797888a7165531618fe92beeb7d78243290295ef8daffc3772cc6a6ca70042ca16326664c9d54acc5de15326788bf248fba4d21680f826907f78705c1063ec45eb293f6d1badecb965013a9c39f89e3f284afcf3e83a09d0a4bb9bcb062c25c7c5c43dcd5fd8fc316f000fe589a1112bcbd06a6383c405e7fe2a09ecdf381e5726f57aca420cb4fd005f677abc4af5bfae0ba51d9eb4f5c03b84633c41835d11ff80ad962103c1d1351cceb4ee557099dfd3e826ce5b849d034630ebb3df5c8d6bae3724bd97d51"
                }
            },
        ]
    },
];