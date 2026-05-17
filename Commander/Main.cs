// using System.Reactive.Linq;
// using System.Reactive.Subjects;


// var subject = new Subject<string>();
// IDisposable? dispi = null;
// dispi = subject.Throttle(TimeSpan.FromMilliseconds(800)).SelectMany(async n =>
// {
//     Console.WriteLine("Berechne");
//     await Task.Run(() => Thread.Sleep(3000));
//     return n;
// })
//     .Subscribe(WerteAus);


// void WerteAus(string wert)
// {
//     Console.WriteLine(wert);
//     if (wert.EndsWith("30"))
//     {
//         dispi?.Dispose();
//         subject = null;
//     }
// }

// foreach (var i in Enumerable.Range(0, 1000))
// {
//     Console.WriteLine($"Ausschüttung: {i}]");
//     subject?.OnNext($"Der {i}");
//     await Task.Delay(i % 10 == 0 ? 1000 : 500);
// }


var server = HttpServer.New();
Globals.InitializeResourceFiles();
Theme.StartChangeDetecting();
server.Start();
WebView.Run();
Icon.StopProcessing();    
server.Stop();



