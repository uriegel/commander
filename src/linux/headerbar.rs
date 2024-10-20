use webkit6::prelude::*;
use webkit6::{
    gtk::{ApplicationWindow, gio::ActionEntry, Builder},
    gio::Cancellable
};

pub struct HeaderBar {}

impl HeaderBar {
    pub fn new(builder: &Builder) {
        let window: ApplicationWindow = builder.object("window").unwrap();
        let app = window.application().unwrap();
        let webview: webkit6::WebView = builder.object("webview").unwrap();

        let webview_clone = webview.clone();
        let action_devtools = ActionEntry::builder("devtools")
            .activate(move |_, _, _|{
                webview_clone.inspector().unwrap().show();
                webview_clone.grab_focus();
            })
            .build();
        app.set_accels_for_action("app.devtools", &["<Ctrl><Shift>I"]);

        let webview_clone = webview.clone();
        let action_show_hidden = ActionEntry::builder("showhidden")
            .state(false.to_variant())
            .activate(move |_, action, _| {
                match action.state() {
                    Some(state) => {
                        if let Some(state) = state.get::<bool>() {
                            action.set_state(&(!state).to_variant());                        
                            webview_clone.evaluate_javascript(&format!("showHidden({})", if state { "false"} else { "true" }), None, None, None::<&Cancellable>, |_|{});
                            webview_clone.grab_focus();
                        }
                    },
                    _ => { }
                }
            })
            .build();
        app.set_accels_for_action("app.showhidden", &["<Ctrl>H"]);
        
        app.add_action_entries([action_devtools]);
        app.add_action_entries([action_show_hidden]);

        // HttpServerBuilder::new()
        //     .port(HTTP_PORT)
        //     .build()
        //     .run(dir.clone());
    }
}

/*
module Titlebar
open GtkDotNet
open GtkDotNet.SafeHandles

let togglePreviewButton = ObjectRef<ToggleButtonHandle>()  

let sendMenuAction (webView: WebViewHandle) cmd = 
    Events.events.TryFind "MenuAction"
    |> Option.iter (fun send -> send cmd)
    webView.GrabFocus()

let togglePreview (webView: WebViewHandle) fromShortcut () =
    let active = 
        if not fromShortcut then 
            togglePreviewButton.Ref.Active() 
        else 
            not (togglePreviewButton.Ref.Active())
    togglePreviewButton.Ref.SetActive active
    Events.events.TryFind "Preview"
    |> Option.iter (fun send -> send active)
    webView.GrabFocus()

let create (app: ApplicationHandle) (window: WindowHandle) (webview: ObjectRef<WebViewHandle>) =
    let headerBar = 
        HeaderBar.New()
            .PackEnd(MenuButton.New()
            )
            .PackEnd(ToggleButton
                        .New()
                        .Ref(togglePreviewButton)
                        .IconName("x-office-presentation")
                        .Tooltip("Vorschau\tF3")
                        .OnClicked(togglePreview webview.Ref false)
            )
            // .PackEnd(Progress.New())
            // .PackEnd(DeleteProgress.New())

    app.AddActions([
        GtkAction("refresh", (fun () -> sendMenuAction webview.Ref "REFRESH"), "<Ctrl>R")
                // new("extendedrename", () => SendMenuAction(webView.Ref, "EXTENDED_RENAME"), "<Ctrl>F2"),
        GtkAction("rename", (fun () -> sendMenuAction webview.Ref "RENAME"), "F2")
        GtkAction("togglePreviewMode", (fun () -> sendMenuAction webview.Ref "TOGGLE_PREVIEW"), "<Ctrl>F3")
        GtkAction("preview", togglePreview webview.Ref true, "F3")
                // new("renameascopy", () => SendMenuAction(webView.Ref, "RENAME_AS_COPY"), "<Shift>F2"),
                // new("copy", () => SendMenuAction(webView.Ref, "COPY"), "F5"),
                // new("move", () => SendMenuAction(webView.Ref, "MOVE"), "F6"),
        GtkAction("delete", (fun () -> sendMenuAction webview.Ref "DELETE"))                
                // new("createfolder", () => SendMenuAction(webView.Ref, "CREATE_FOLDER"), "F7"),
        GtkAction("favorites", (fun () -> sendMenuAction webview.Ref "FAVORITES"), "F1")
        GtkAction("adaptpath", (fun () -> sendMenuAction webview.Ref "ADAPT_PATH"), "F9")
        GtkAction("selectall", (fun () -> sendMenuAction webview.Ref "SEL_ALL"), "KP_Add")
        GtkAction("selectnone", (fun () -> sendMenuAction webview.Ref "SEL_NONE"), "KP_Subtract")
        GtkAction("devtools", (fun () -> webview.Ref.GetInspector().Show()), "<Shift><Ctrl>I")
    ]) |> ignore
 */