use std::time::Duration;

use gtk::glib::{self, spawn_future_local, timeout_future};
use gtk::glib::clone;
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

        let action_devtools = ActionEntry::builder("devtools")
            .activate(clone!(#[weak]webview, move |_, _, _|{
                let inspector = webview.inspector().unwrap();
                inspector.show();
                webview.grab_focus();
                spawn_future_local(async move {
                    timeout_future(Duration::from_millis(600)).await;
                    inspector.detach();           
                });
            }))
            .build();
        app.set_accels_for_action("app.devtools", &["<Ctrl><Shift>I"]);
        app.add_action_entries([action_devtools]);

        let action_show_hidden = ActionEntry::builder("showhidden")
            .state(false.to_variant())
            .activate(clone!(#[weak]webview, move |_, action, _|{ 
                action.state().inspect(|state|{
                    if let Some(state) = state.get::<bool>() {
                        action.set_state(&(!state).to_variant());                        
                        webview.evaluate_javascript(&format!("showHidden({})", if state { "false"} else { "true" }), None, None, None::<&Cancellable>, |_|{});
                        webview.grab_focus();
                    }
                });
            })
            )
            .build();
        app.set_accels_for_action("app.showhidden", &["<Ctrl>H"]);
        app.add_action_entries([action_show_hidden]);
        
        let action_show_preview = ActionEntry::builder("showpreview")
            .state(false.to_variant())
            .activate(clone!(#[weak]webview, move |_, action, _|{ 
                action.state().inspect(|state|{
                    if let Some(state) = state.get::<bool>() {
                        action.set_state(&(!state).to_variant());                        
                        webview.evaluate_javascript(&format!("showPreview({})", if state { "false"} else { "true" }), None, None, None::<&Cancellable>, |_|{});
                        webview.grab_focus();
                    }
                });
            })
            )
            .build();
        app.set_accels_for_action("app.showpreview", &["F3"]);
        app.add_action_entries([action_show_preview]);
    }
}

/*
    app.AddActions([
        GtkAction("refresh", (fun () -> sendMenuAction webview.Ref "REFRESH"), "<Ctrl>R")
                // new("extendedrename", () => SendMenuAction(webView.Ref, "EXTENDED_RENAME"), "<Ctrl>F2"),
        GtkAction("rename", (fun () -> sendMenuAction webview.Ref "RENAME"), "F2")
                // new("renameascopy", () => SendMenuAction(webView.Ref, "RENAME_AS_COPY"), "<Shift>F2"),
                // new("copy", () => SendMenuAction(webView.Ref, "COPY"), "F5"),
                // new("move", () => SendMenuAction(webView.Ref, "MOVE"), "F6"),
        GtkAction("delete", (fun () -> sendMenuAction webview.Ref "DELETE"))                
                // new("createfolder", () => SendMenuAction(webView.Ref, "CREATE_FOLDER"), "F7"),
        GtkAction("favorites", (fun () -> sendMenuAction webview.Ref "FAVORITES"), "F1")
        GtkAction("adaptpath", (fun () -> sendMenuAction webview.Ref "ADAPT_PATH"), "F9")
        GtkAction("selectall", (fun () -> sendMenuAction webview.Ref "SEL_ALL"), "KP_Add")
        GtkAction("selectnone", (fun () -> sendMenuAction webview.Ref "SEL_NONE"), "KP_Subtract")
    ]) |> ignore
 */