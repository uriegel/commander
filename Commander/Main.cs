var server = HttpServer.New();
Globals.InitializeResourceFiles();
Theme.StartChangeDetecting();
server.Start();
WebView.Run();
Icon.StopProcessing();    
server.Stop();



