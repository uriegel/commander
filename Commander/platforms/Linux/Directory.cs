#if Linux

using Microsoft.AspNetCore.Http;

using AspNetExtensions;
using CsTools.Extensions;
using GtkDotNet;
using LinqTools;

using static CsTools.Core;
using CsTools;
using System.Runtime.InteropServices;

static partial class Directory
{
    public static string GetIconPath(FileInfo info)
        => info.Extension?.Length > 0 ? info.Extension : ".noextension";

    public static Task ProcessIcon(HttpContext context, string iconHint)
        => RepeatOnException(async () => 
            await Application.Dispatch(async () =>
                {
            //         // using var iconInfo = IconInfo.Choose(iconHint, 16, IconLookup.ForceSvg);
                    var type = Gtk.GuessContentType(iconHint);
                    var icon = IconGet(type);
                    var names = IconGetNames(icon);
                    var handle = ChooseIcon(IntPtr.Zero, names, 16, IconLookup.ForceRegular);
            //         // var iconFile = iconInfo.GetFileName();
            //         // using var stream = iconFile?.OpenFile();
            //         // await context.SendStream(stream!, startTime, iconFile);
               }, 100), 
            1);

    [DllImport("libgtk-4.so", EntryPoint="g_content_type_get_icon", CallingConvention = CallingConvention.Cdecl)]
    extern static IntPtr IconGet(string contentType);
    [DllImport("libgtk-4.so", EntryPoint="g_themed_icon_get_names", CallingConvention = CallingConvention.Cdecl)]
    extern static IntPtr IconGetNames(IntPtr icon);
    [DllImport("libgtk-4.so", EntryPoint="gtk_icon_theme_choose_icon", CallingConvention = CallingConvention.Cdecl)]
    extern static IntPtr ChooseIcon(IntPtr theme, IntPtr iconNames, int size, IconLookup flags);

    public static Task<GetExtendedItemsResult> GetExtendedItems(GetExtendedItems getExtendedItems)
        => GetExtendedItems(getExtendedItems.Path, getExtendedItems.Items)
            .ToAsync();

    public static Task<IOResult> DeleteItems(DeleteItemsParam input)
        => Application.Dispatch(() =>
        {
            input.Names.ForEach(Trash);
            return new IOResult(null);

            void Trash(string name)
            {
                var file = GFile.New(input.Path.AppendPath(name));
                var error = IntPtr.Zero;
                GFile.Trash(file, IntPtr.Zero, ref error);
                GObject.Unref(file);
            }
        }, 100)
            .Catch(MapExceptionToIOResult);

    static void CopyItem(string name, string path, string targetPath, Action<long, long> progress, bool move, CancellationToken cancellationToken) { }
    // => Copy(path.AppendPath(name), targetPath.AppendPath(name), FileCopyFlags.Overwrite,
    //         (c, t) => progress(c, t), move, cancellationToken);

    // static void Copy(string source, string target, FileCopyFlags flags, GFile.ProgressCallback cb, bool move,
    //     CancellationToken cancellationToken)
    // {
    //     if (move)
    //         GtkDotNet.GFile.Move(source, target, flags, true, cb, cancellationToken);
    //     else
    //         GtkDotNet.GFile.Copy(source, target, flags, true, cb, cancellationToken);
    // }

    static IOError MapExceptionToIOError(Exception e)
        => e switch
        {
            UnauthorizedAccessException ue                     => IOError.AccessDenied,
            GtkDotNet.GErrorException gee  when gee.Code ==  1 => IOError.FileNotFound, 
            GtkDotNet.GErrorException gee  when gee.Code == 14 => IOError.AccessDenied,
            _                                                  => IOError.Exn
        };

    static readonly DateTime startTime = DateTime.Now;
}

record GetExtendedItemsResult(
    DateTime?[] ExifTimes,
    string Path
);

#endif

    // TODO KDE
    // let getKdeIcon ext = async {
    //     let extractMime str = 
    //         let pos1 = str |> String.indexOf "('" 
    //         let pos2 = str |> String.indexOf "',"
    //         match pos1, pos2 with
    //         | Some pos1, Some pos2 
    //             -> Some (str |> String.substring2 (pos1+2) (pos2-pos1-2))
    //         | _ -> None

    //     let replaceSlash str = Some (str |> String.replaceChar  '/' '-')
    //     let getMime = extractMime >=> replaceSlash

    //     let mapVarious mime =
    //         match mime with
    //         | "/usr/share/icons/breeze/mimetypes/16/application-x-msdos-program.svg" 
    //                         -> "/usr/share/icons/breeze/mimetypes/16/application-x-ms-dos-executable.svg"
    //         | "/usr/share/icons/breeze/mimetypes/16/application-java-archive.svg"    
    //                         -> "/usr/share/icons/breeze/mimetypes/16/application-x-jar.svg"
    //         | s     -> s

    //     let! mimeType = asyncRunCmd "python3" (sprintf "%s *%s" (getIconScript ()) ext)

    //     let icon = 
    //         sprintf "/usr/share/icons/breeze/mimetypes/16/%s.svg" (mimeType |> getMime |> defaultValue "application-x-zerosize")
    //         |> mapVarious
    //         |> getExistingFile
    //         |> Option.defaultValue "/usr/share/icons/breeze/mimetypes/16/application-x-zerosize.svg"
    //     return icon, "image/svg+xml"
    // }

//     return! 
//         match getPlatform () with
// //        | Platform.Kde -> getKdeIcon ext
//         | _            -> async { return getIcon ext, "image/png" }
