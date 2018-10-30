const registrationAuthorities = [
    {
        "key": {
            "modulus": "0x00b289e77666a62fd49faaae0a8dff9bedd418917956115c240bea58497259fcc9375c8718e75c7f2c1de37de3ad67635cd8b6e1fdc05e60ae34f8ef853f666cc8c269c6caf386c4dbd3bf19e47d6169210b353a10218e132ea688176ffb8039379a67f446809f8383496446c01ea4e0bec270fd1dfcc2ad719e4ddfa8bb40edda07a504a32f244452db7db969d14c75ab879bd172bb8edf1c8a7faeaff74326c296883542daac364a15b934cb95211a97384481d7c9c4b2c0e44481159a49fd340730fb991a0e3dbdf5efb0a788038b5cb9f354e1d502bdf63e394171ea1e9c04be611cf30200d8ed8f7e067b19aa662c357e4dcc1be7ae16267d30810b4e15c9",
            "e": "0x10001",
            "d": "0x00a7c1921e1b676dabe076d45f907b2b7d757bbc3d01550079d24458be72570181e3a5ea3ec92d8d44dbb4a4d62859ebf012a50c858c9a61476ef8b4be440b2e8e18b6a1169369ff50fa8e267b1e204852c72035357101f91e2d55d487e10de3354ebcfcb6be26a3c0d9560270849ab19e2c3f546637d8887628a3cd52d2d7b86441bd3f261bdc872139845eacb6fc3b6be45f4d6f660a4849920aa2d6dc07e4f03239995bcdfdda46ee80093bdd870c147d14b00a6995f5b556e75dc0a100e866b68773207b520fbb815a71b3fc4cb9bcde546c2a5e4f414220a02e4f7611d949e9ac3aac84735d057c43dc0349b543646762838b5549b751dcd629e87ca8b4dd"
        },
        "address": "0xc5fdf4076b8f3a5357c5e395ab970b5b54098fef"
    }
];

module.exports = [
    {
        "topic": "Who will police the police?",
        "candidates": ["Super Troopers", "Police all the way down", "Coast Guard"],
        "phase": 1,
        "registration_authority": registrationAuthorities[0],
        "voters": [
            {
                "public_address": "0x627306090abab3a6e1400e9345bc60c78a8bef57",
                "anonymous_address": "0xf17f52151ebef6c7334fad080c5704d77216b732",
                "blinding_factor": "+0QeOwT++AXt5G0vsCOhVhYwJj5OAtVx3WvW6yG8eqDj",
                "brave_hashes": {
                    "blindedAddress": "873933",
                    "blindSignature": "99062",
                    "vote": "908233"
                }
            }
        ],
        "brave_hashes": {
            "params": "622468"
        }
    }
];