#if Windows

partial class ExtendedInfos
{
    bool ForExtended(string name)
        => ForExif(name)
            || name.EndsWith(".exe", StringComparison.InvariantCultureIgnoreCase)
            || name.EndsWith(".dll", StringComparison.InvariantCultureIgnoreCase);

    ExtendedData? GetExtendedData(string path, string file)
        => ExtendedData.Get(path, file, Directory.CheckGetVersion(path, file));
}

record ExtendedData(
    string Path,
    string Name,
    Version Version
)
{
    public static ExtendedData? Get(string path, string name, Version? version)
        => version != null
            ? new ExtendedData(path, name, version)
            : null;
}

#endif