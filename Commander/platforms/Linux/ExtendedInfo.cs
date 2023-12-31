#if Linux

partial class ExtendedInfos
{
    bool ForExtended(string name) => ForExif(name)

    ExtendedData? GetExtendedData(string file) => null;
}

record ExtendedData();

#endif