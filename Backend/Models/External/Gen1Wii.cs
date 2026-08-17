// This is a generated file! Please edit source .ksy file and use kaitai-struct-compiler to rebuild

using System.Collections.Generic;

namespace Kaitai
{
    public partial class Gen1Wii : KaitaiStruct
    {
        public static Gen1Wii FromFile(string fileName)
        {
            return new Gen1Wii(new KaitaiStream(fileName));
        }

        public Gen1Wii(KaitaiStream p__io, KaitaiStruct p__parent = null, Gen1Wii p__root = null) : base(p__io)
        {
            m_parent = p__parent;
            m_root = p__root ?? this;
            _read();
        }
        private void _read()
        {
            _unknown1 = m_io.ReadBitsIntBe(1) != 0;
            _gender = m_io.ReadBitsIntBe(1) != 0;
            _birthMonth = m_io.ReadBitsIntBe(4);
            _birthDay = m_io.ReadBitsIntBe(5);
            _favoriteColor = m_io.ReadBitsIntBe(4);
            _favorite = m_io.ReadBitsIntBe(1) != 0;
            m_io.AlignToByte();
            _miiName = System.Text.Encoding.GetEncoding("UTF-16BE").GetString(m_io.ReadBytes(20));
            _bodyHeight = m_io.ReadU1();
            _bodyWeight = m_io.ReadU1();
            _avatarId = new List<byte>();
            for (var i = 0; i < 4; i++)
            {
                _avatarId.Add(m_io.ReadU1());
            }
            _clientId = new List<byte>();
            for (var i = 0; i < 4; i++)
            {
                _clientId.Add(m_io.ReadU1());
            }
            _faceType = m_io.ReadBitsIntBe(3);
            _faceColor = m_io.ReadBitsIntBe(3);
            _facialFeature = m_io.ReadBitsIntBe(4);
            _unknown2 = m_io.ReadBitsIntBe(3);
            _mingle = m_io.ReadBitsIntBe(1) != 0;
            _unknown3 = m_io.ReadBitsIntBe(1) != 0;
            _downloaded = m_io.ReadBitsIntBe(1) != 0;
            _hairType = m_io.ReadBitsIntBe(7);
            _hairColor = m_io.ReadBitsIntBe(3);
            _hairFlip = m_io.ReadBitsIntBe(1) != 0;
            _unknown4 = m_io.ReadBitsIntBe(5);
            _eyebrowType = m_io.ReadBitsIntBe(5);
            _unknown5 = m_io.ReadBitsIntBe(1) != 0;
            _eyebrowRotation = m_io.ReadBitsIntBe(4);
            _unknown6 = m_io.ReadBitsIntBe(6);
            _eyebrowColor = m_io.ReadBitsIntBe(3);
            _eyebrowSize = m_io.ReadBitsIntBe(4);
            _eyebrowVertical = m_io.ReadBitsIntBe(5);
            _eyebrowHorizontal = m_io.ReadBitsIntBe(4);
            _eyeType = m_io.ReadBitsIntBe(6);
            _unknown7 = m_io.ReadBitsIntBe(2);
            _eyeRotation = m_io.ReadBitsIntBe(3);
            _eyeVertical = m_io.ReadBitsIntBe(5);
            _eyeColor = m_io.ReadBitsIntBe(3);
            _unknown8 = m_io.ReadBitsIntBe(1) != 0;
            _eyeSize = m_io.ReadBitsIntBe(3);
            _eyeHorizontal = m_io.ReadBitsIntBe(4);
            _unknown9 = m_io.ReadBitsIntBe(5);
            _noseType = m_io.ReadBitsIntBe(4);
            _noseSize = m_io.ReadBitsIntBe(4);
            _noseVertical = m_io.ReadBitsIntBe(5);
            _unknown10 = m_io.ReadBitsIntBe(3);
            _mouthType = m_io.ReadBitsIntBe(5);
            _mouthColor = m_io.ReadBitsIntBe(2);
            _mouthSize = m_io.ReadBitsIntBe(4);
            _mouthVertical = m_io.ReadBitsIntBe(5);
            _glassesType = m_io.ReadBitsIntBe(4);
            _glassesColor = m_io.ReadBitsIntBe(3);
            _unknown11 = m_io.ReadBitsIntBe(1) != 0;
            _glassesSize = m_io.ReadBitsIntBe(3);
            _glassesVertical = m_io.ReadBitsIntBe(5);
            _facialHairMustache = m_io.ReadBitsIntBe(2);
            _facialHairBeard = m_io.ReadBitsIntBe(2);
            _facialHairColor = m_io.ReadBitsIntBe(3);
            _facialHairSize = m_io.ReadBitsIntBe(4);
            _facialHairVertical = m_io.ReadBitsIntBe(5);
            _moleEnable = m_io.ReadBitsIntBe(1) != 0;
            _moleSize = m_io.ReadBitsIntBe(4);
            _moleVertical = m_io.ReadBitsIntBe(5);
            _moleHorizontal = m_io.ReadBitsIntBe(5);
            _unknown12 = m_io.ReadBitsIntBe(1) != 0;
            m_io.AlignToByte();
            _creatorName = System.Text.Encoding.GetEncoding("UTF-16BE").GetString(m_io.ReadBytes(20));
        }
        private bool _unknown1;
        private bool _gender;
        private ulong _birthMonth;
        private ulong _birthDay;
        private ulong _favoriteColor;
        private bool _favorite;
        private string _miiName;
        private byte _bodyHeight;
        private byte _bodyWeight;
        private List<byte> _avatarId;
        private List<byte> _clientId;
        private ulong _faceType;
        private ulong _faceColor;
        private ulong _facialFeature;
        private ulong _unknown2;
        private bool _mingle;
        private bool _unknown3;
        private bool _downloaded;
        private ulong _hairType;
        private ulong _hairColor;
        private bool _hairFlip;
        private ulong _unknown4;
        private ulong _eyebrowType;
        private bool _unknown5;
        private ulong _eyebrowRotation;
        private ulong _unknown6;
        private ulong _eyebrowColor;
        private ulong _eyebrowSize;
        private ulong _eyebrowVertical;
        private ulong _eyebrowHorizontal;
        private ulong _eyeType;
        private ulong _unknown7;
        private ulong _eyeRotation;
        private ulong _eyeVertical;
        private ulong _eyeColor;
        private bool _unknown8;
        private ulong _eyeSize;
        private ulong _eyeHorizontal;
        private ulong _unknown9;
        private ulong _noseType;
        private ulong _noseSize;
        private ulong _noseVertical;
        private ulong _unknown10;
        private ulong _mouthType;
        private ulong _mouthColor;
        private ulong _mouthSize;
        private ulong _mouthVertical;
        private ulong _glassesType;
        private ulong _glassesColor;
        private bool _unknown11;
        private ulong _glassesSize;
        private ulong _glassesVertical;
        private ulong _facialHairMustache;
        private ulong _facialHairBeard;
        private ulong _facialHairColor;
        private ulong _facialHairSize;
        private ulong _facialHairVertical;
        private bool _moleEnable;
        private ulong _moleSize;
        private ulong _moleVertical;
        private ulong _moleHorizontal;
        private bool _unknown12;
        private string _creatorName;
        private Gen1Wii m_root;
        private KaitaiStruct m_parent;
        public bool Unknown1 { get { return _unknown1; } }
        public bool Gender { get { return _gender; } }
        public ulong BirthMonth { get { return _birthMonth; } }
        public ulong BirthDay { get { return _birthDay; } }
        public ulong FavoriteColor { get { return _favoriteColor; } }
        public bool Favorite { get { return _favorite; } }
        public string MiiName { get { return _miiName; } }
        public byte BodyHeight { get { return _bodyHeight; } }
        public byte BodyWeight { get { return _bodyWeight; } }
        public List<byte> AvatarId { get { return _avatarId; } }
        public List<byte> ClientId { get { return _clientId; } }
        public ulong FaceType { get { return _faceType; } }
        public ulong FaceColor { get { return _faceColor; } }
        public ulong FacialFeature { get { return _facialFeature; } }
        public ulong Unknown2 { get { return _unknown2; } }
        public bool Mingle { get { return _mingle; } }
        public bool Unknown3 { get { return _unknown3; } }
        public bool Downloaded { get { return _downloaded; } }
        public ulong HairType { get { return _hairType; } }
        public ulong HairColor { get { return _hairColor; } }
        public bool HairFlip { get { return _hairFlip; } }
        public ulong Unknown4 { get { return _unknown4; } }
        public ulong EyebrowType { get { return _eyebrowType; } }
        public bool Unknown5 { get { return _unknown5; } }
        public ulong EyebrowRotation { get { return _eyebrowRotation; } }
        public ulong Unknown6 { get { return _unknown6; } }
        public ulong EyebrowColor { get { return _eyebrowColor; } }
        public ulong EyebrowSize { get { return _eyebrowSize; } }
        public ulong EyebrowVertical { get { return _eyebrowVertical; } }
        public ulong EyebrowHorizontal { get { return _eyebrowHorizontal; } }
        public ulong EyeType { get { return _eyeType; } }
        public ulong Unknown7 { get { return _unknown7; } }
        public ulong EyeRotation { get { return _eyeRotation; } }
        public ulong EyeVertical { get { return _eyeVertical; } }
        public ulong EyeColor { get { return _eyeColor; } }
        public bool Unknown8 { get { return _unknown8; } }
        public ulong EyeSize { get { return _eyeSize; } }
        public ulong EyeHorizontal { get { return _eyeHorizontal; } }
        public ulong Unknown9 { get { return _unknown9; } }
        public ulong NoseType { get { return _noseType; } }
        public ulong NoseSize { get { return _noseSize; } }
        public ulong NoseVertical { get { return _noseVertical; } }
        public ulong Unknown10 { get { return _unknown10; } }
        public ulong MouthType { get { return _mouthType; } }
        public ulong MouthColor { get { return _mouthColor; } }
        public ulong MouthSize { get { return _mouthSize; } }
        public ulong MouthVertical { get { return _mouthVertical; } }
        public ulong GlassesType { get { return _glassesType; } }
        public ulong GlassesColor { get { return _glassesColor; } }
        public bool Unknown11 { get { return _unknown11; } }
        public ulong GlassesSize { get { return _glassesSize; } }
        public ulong GlassesVertical { get { return _glassesVertical; } }
        public ulong FacialHairMustache { get { return _facialHairMustache; } }
        public ulong FacialHairBeard { get { return _facialHairBeard; } }
        public ulong FacialHairColor { get { return _facialHairColor; } }
        public ulong FacialHairSize { get { return _facialHairSize; } }
        public ulong FacialHairVertical { get { return _facialHairVertical; } }
        public bool MoleEnable { get { return _moleEnable; } }
        public ulong MoleSize { get { return _moleSize; } }
        public ulong MoleVertical { get { return _moleVertical; } }
        public ulong MoleHorizontal { get { return _moleHorizontal; } }
        public bool Unknown12 { get { return _unknown12; } }
        public string CreatorName { get { return _creatorName; } }
        public Gen1Wii M_Root { get { return m_root; } }
        public KaitaiStruct M_Parent { get { return m_parent; } }
    }
}
