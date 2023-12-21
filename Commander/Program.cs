#if Windows

using CsTools.Extensions;


System.Windows.Forms.MessageBox.Show($"Das bin ich {(args.Length > 0 ? args[0] : "Nix")}");

if (args.Length > 0 && args[0] == "-adminMode") 
{
    await UacServer.Run(args[1].ParseInt() ?? 0);
    return;
}
        
#endif

Window.Run();



