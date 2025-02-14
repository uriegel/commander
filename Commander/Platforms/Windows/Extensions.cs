using System.Diagnostics;

static class Extensions
{
    public static Version? MapVersion(this FileVersionInfo? info)
        => info != null
            ? new(info.FileMajorPart, info.FileMinorPart, info.FilePrivatePart, info.FileBuildPart)
            : null;
}    
