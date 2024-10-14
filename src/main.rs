#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
// Allows console to show up in debug build but not release build.

use std::{thread, time::Duration};

use gtk::{prelude::*, ApplicationWindow};
use gtk::gio::ActionEntry;
use serde::{Deserialize, Serialize};
use webkit6::prelude::*;
use webview_app::{application::Application, request::{self, request_blocking, Request}, webview::WebView};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Input {
    pub text: String,
    pub id: i32
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Output {
    pub text: String,
    pub email: String,
    pub number: i32
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Outputs {
    pub outputs: Vec<Output>
}

fn on_activate(app: &Application)->WebView {
    let webview_builder = WebView::builder(app)
        .save_bounds()
        .title("Commander".to_string())
        .devtools(true)
        .debug_url("http://localhost:5173/".to_string())
        .default_contextmenu_disabled()
        .without_native_titlebar();

    #[cfg(target_os = "linux")]    
    let webview_builder = webview_builder.with_builder("/de/uriegel/commander/window.ui".to_string(), |builder| {
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
    });

    let webview = webview_builder.build();
    
    webview.connect_request(|request, id, cmd: String, json| {
        match cmd.as_str() {
            "cmd1" => cmd1(request, id, json),
            "cmd2" => cmd2(request, id),
            _ => {}
        }
        true
    });
    webview
}

fn main() {

    #[cfg(target_os = "linux")]        
    gtk::gio::resources_register_include!("commander.gresource")
        .expect("Failed to register resources.");

    Application::new("de.uriegel.commander")
    .on_activate(on_activate)
    .run();
}

fn cmd1(request: &Request, id: String, json: String) {
    request_blocking(request, id, move || {
        let input: Input = request::get_input(&json);
        let res = Output {
            email: "uriegel@hotmail.de".to_string(),
            text: input.text,
            number: input.id + 1,
        };
        request::get_output(&res)
    })
}

fn cmd2(request: &Request, id: String) {
    request_blocking(request, id, move || {
        let five_seconds = Duration::from_secs(5);
        thread::sleep(five_seconds);

        let res = Output {
            email: "uriegel@hotmail.de".to_string(),
            text: "Return fom cmd2  sd fd fdsf dsfdsg fdg dfg dfgdfgfdgdfgdfgdffdg dfg dfg dfgdfg dfg dfgdfg dfg dfg".to_string(),
            number: 222,
        };
        request::get_output(&res)
    })
}

// TODO Linux Titlebar
// TODO Windows Beenden form menu minimizes the window
// TODO Release  version via res scheme
// TODO README describe npm init in sub folder webroot
// TODO README describe debugging
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