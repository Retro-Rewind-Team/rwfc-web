using System.Text;

namespace RetroRewindWebsite.Tests.TestHelpers;

// Builds a minimal but valid 0x88-byte RKG file matching the format expected by GhostFileService.
// Bit layout mirrors the constants and bit-shift logic in GhostFileService.
public static class RkgTestData
{
    public static byte[] BuildValidRkg(
        byte finishMinutes = 1,
        byte finishSeconds = 30,
        ushort finishMs = 0,
        short trackId = 5,
        short vehicleId = 1,
        short characterId = 2,
        int year = 2024,
        int month = 3,
        int day = 15,
        short controllerId = 0,
        short driftType = 0,
        short transmissionBits = 0,
        byte lapCount = 3,
        string miiName = "Test")
    {
        var bytes = new byte[0x88];

        // 0x00: Magic "RKGD"
        Encoding.ASCII.GetBytes("RKGD").CopyTo(bytes, 0x00);

        // 0x04: Time+Track (big-endian uint32)
        // minutes[31:25] seconds[24:18] milliseconds[17:8] trackId[7:2]
        uint timeValue = ((uint)finishMinutes << 25) |
                         ((uint)finishSeconds << 18) |
                         ((uint)finishMs << 8) |
                         ((uint)(ushort)trackId << 2);
        WriteUInt32BE(bytes, 0x04, timeValue);

        // 0x08: StatsInfo (big-endian uint32)
        // vehicleId[31:26] characterId[25:20] (year-2000)[19:13] month[12:9] day[8:4] controllerId[3:0]
        uint statsInfo = ((uint)(ushort)vehicleId << 26) |
                         ((uint)(ushort)characterId << 20) |
                         ((uint)(year - 2000) << 13) |
                         ((uint)month << 9) |
                         ((uint)day << 4) |
                         (uint)(ushort)controllerId;
        WriteUInt32BE(bytes, 0x08, statsInfo);

        // 0x0C: Info2 (big-endian uint16)
        // transmissionBits[10:9] driftType[1]
        ushort info2 = (ushort)(((ushort)transmissionBits << 9) | ((ushort)driftType << 1));
        WriteUInt16BE(bytes, 0x0C, info2);

        // 0x10: Lap count
        bytes[0x10] = lapCount;

        // 0x11: Lap splits (3 bytes each) -- distribute finish time evenly across stored laps
        int finishTimeMs = finishMinutes * 60000 + finishSeconds * 1000 + finishMs;
        int lapTimeMs = lapCount > 0 ? finishTimeMs / lapCount : 0;
        int storedLaps = Math.Min((int)lapCount, 5);
        for (int i = 0; i < storedLaps; i++)
        {
            int offset = 0x11 + i * 3;
            byte lapMins = (byte)(lapTimeMs / 60000);
            byte lapSecs = (byte)((lapTimeMs % 60000) / 1000);
            ushort lapMillis = (ushort)(lapTimeMs % 1000);
            uint lapValue = ((uint)lapMins << 17) | ((uint)lapSecs << 10) | lapMillis;
            bytes[offset] = (byte)(lapValue >> 16);
            bytes[offset + 1] = (byte)(lapValue >> 8);
            bytes[offset + 2] = (byte)lapValue;
        }

        // 0x3E: Mii name (big-endian Unicode, 20 bytes)
        var nameBytes = Encoding.BigEndianUnicode.GetBytes(miiName);
        int toCopy = Math.Min(nameBytes.Length, 20);
        nameBytes.AsSpan(0, toCopy).CopyTo(bytes.AsSpan(0x3E));

        return bytes;
    }

    private static void WriteUInt32BE(byte[] bytes, int offset, uint value)
    {
        bytes[offset] = (byte)(value >> 24);
        bytes[offset + 1] = (byte)(value >> 16);
        bytes[offset + 2] = (byte)(value >> 8);
        bytes[offset + 3] = (byte)value;
    }

    private static void WriteUInt16BE(byte[] bytes, int offset, ushort value)
    {
        bytes[offset] = (byte)(value >> 8);
        bytes[offset + 1] = (byte)value;
    }
}
