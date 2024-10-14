use std::sync::{Arc, Mutex};

use gtk::prelude::*;
use gtk::{ApplicationWindow, gio::ActionEntry, Builder};
use include_dir::Dir;
use webkit6::prelude::*;

use crate::httpserver::httpserver::HttpServerBuilder;

pub struct HeaderBar;

impl HeaderBar {
    pub fn new(builder: &Builder, dir: Option<Arc<Mutex<Dir<'static>>>>) {
        let window: ApplicationWindow = builder.object("window").unwrap();
        let app = window.application().unwrap();
        let webview: webkit6::WebView = builder.object("webview").unwrap();

        let action = ActionEntry::builder("devtools")
            .activate(move |_, _, _| {
                webview.inspector().unwrap().show();
            })
            .build();
        app.set_accels_for_action("app.devtools", &["<Ctrl><Shift>I"]);
        app.add_action_entries([action]);

        HttpServerBuilder::new()
            .port(7890)
            .build()
            .run(dir.clone());

    }
}

/*
module Titlebar
open GtkDotNet
open GtkDotNet.SafeHandles

let togglePreviewButton = ObjectRef<ToggleButtonHandle>()  

let onShowHidden (webView: WebViewHandle) (show: bool) = 
    Events.events.TryFind "ShowHidden"
    |> Option.iter (fun send -> send show)
    webView.GrabFocus()

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
        GtkAction("showhidden", false, onShowHidden webview.Ref, "<Ctrl>H")
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