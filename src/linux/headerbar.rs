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
    
       let action_refresh = ActionEntry::builder("refresh")
            .activate(clone!(#[weak]webview, move |_, _, _|{
                webview.evaluate_javascript("menuAction('REFRESH')", None, None, None::<&Cancellable>, |_|{});
                webview.grab_focus();
            }))
            .build();
        app.set_accels_for_action("app.refresh", &["<Ctrl>R"]);
        app.add_action_entries([action_refresh]);

        let action_favorites = ActionEntry::builder("favorites")
            .activate(clone!(#[weak]webview, move |_, _, _|{
                webview.evaluate_javascript("menuAction('FAVORITES')", None, None, None::<&Cancellable>, |_|{});
                webview.grab_focus();
            }))
            .build();
        app.set_accels_for_action("app.favorites", &["F1"]);
        app.add_action_entries([action_favorites]);

        let action_create_folder = ActionEntry::builder("createfolder")
            .activate(clone!(#[weak]webview, move |_, _, _|{
                webview.evaluate_javascript("menuAction('CREATE_FOLDER')", None, None, None::<&Cancellable>, |_|{});
                webview.grab_focus();
            }))
            .build();
        app.set_accels_for_action("app.createfolder", &["F7"]);
        app.add_action_entries([action_create_folder]);

        let action_adapt_path = ActionEntry::builder("adaptpath")
            .activate(clone!(#[weak]webview, move |_, _, _|{
                webview.evaluate_javascript("menuAction('ADAPT_PATH')", None, None, None::<&Cancellable>, |_|{});
                webview.grab_focus();
            }))
            .build();
        app.set_accels_for_action("app.adaptpath", &["F9"]);
        app.add_action_entries([action_adapt_path]);

        let action_select_all = ActionEntry::builder("selectall")
            .activate(clone!(#[weak]webview, move |_, _, _|{
                webview.evaluate_javascript("menuAction('SEL_ALL')", None, None, None::<&Cancellable>, |_|{});
                webview.grab_focus();
            }))
            .build();
        app.set_accels_for_action("app.selectall", &["KP_Add"]);
        app.add_action_entries([action_select_all]);

        let action_select_none = ActionEntry::builder("selectnone")
            .activate(clone!(#[weak]webview, move |_, _, _|{
                webview.evaluate_javascript("menuAction('SEL_NONE')", None, None, None::<&Cancellable>, |_|{});
                webview.grab_focus();
            }))
            .build();
        app.set_accels_for_action("app.selectnone", &["KP_Subtract"]);
        app.add_action_entries([action_select_none]);

        let action_toggle_preview = ActionEntry::builder("togglePreviewMode")
            .activate(clone!(#[weak]webview, move |_, _, _|{
                webview.evaluate_javascript("menuAction('TOGGLE_PREVIEW')", None, None, None::<&Cancellable>, |_|{});
                webview.grab_focus();
            }))
            .build();
        app.set_accels_for_action("app.togglePreviewMode", &["<Ctrl>F3"]);
        app.add_action_entries([action_toggle_preview]);

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
        // new("extendedrename", () => SendMenuAction(webView.Ref, "EXTENDED_RENAME"), "<Ctrl>F2"),
        GtkAction("rename", (fun () -> sendMenuAction webview.Ref "RENAME"), "F2")
                // new("renameascopy", () => SendMenuAction(webView.Ref, "RENAME_AS_COPY"), "<Shift>F2"),
                // new("copy", () => SendMenuAction(webView.Ref, "COPY"), "F5"),
                // new("move", () => SendMenuAction(webView.Ref, "MOVE"), "F6"),
        GtkAction("delete", (fun () -> sendMenuAction webview.Ref "DELETE"))                
                
*/