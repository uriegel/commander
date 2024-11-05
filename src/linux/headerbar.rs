use std::time::Duration;

use gtk::glib::{self, spawn_future_local, timeout_future};
use gtk::glib::clone;
use webkit6::prelude::*;
use webkit6::{
    gtk::{ApplicationWindow, gio::ActionEntry, Builder},
    gio::Cancellable
};

use crate::progresses::set_progress_sender;

use super::progress_display::ProgressDisplay;

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

        let action_toggle_preview = ActionEntry::builder("togglePreviewMode")
            .activate(clone!(#[weak]webview, move |_, _, _|{
                webview.evaluate_javascript("menuAction('TOGGLE_PREVIEW')", None, None, None::<&Cancellable>, |_|{});
                webview.grab_focus();
            }))
            .build();
        app.set_accels_for_action("app.togglePreviewMode", &["<Ctrl>F3"]);
        app.add_action_entries([action_toggle_preview]);

        let action_rename = ActionEntry::builder("rename")
            .activate(clone!(#[weak]webview, move |_, _, _|{
                webview.evaluate_javascript("menuAction('RENAME')", None, None, None::<&Cancellable>, |_|{});
                webview.grab_focus();
            }))
            .build();
        app.set_accels_for_action("app.rename", &["F2"]);
        app.add_action_entries([action_rename]);

        let action_extended_rename = ActionEntry::builder("extendedrename")
            .activate(clone!(#[weak]webview, move |_, _, _|{
                webview.evaluate_javascript("menuAction('EXTENDED_RENAME')", None, None, None::<&Cancellable>, |_|{});
                webview.grab_focus();
            }))
            .build();
        app.set_accels_for_action("app.extendedrename", &["<Ctrl>F2"]);
        app.add_action_entries([action_extended_rename]);

        let action_rename_as_copy = ActionEntry::builder("renameascopy")
            .activate(clone!(#[weak]webview, move |_, _, _|{
                webview.evaluate_javascript("menuAction('RENAME_AS_COPY')", None, None, None::<&Cancellable>, |_|{});
                webview.grab_focus();
            }))
            .build();
        app.set_accels_for_action("app.renameascopy", &["<Shift>F2"]);
        app.add_action_entries([action_rename_as_copy]);

        let action_copy = ActionEntry::builder("copy")
            .activate(clone!(#[weak]webview, move |_, _, _|{
                webview.evaluate_javascript("menuAction('COPY')", None, None, None::<&Cancellable>, |_|{});
                webview.grab_focus();
            }))
            .build();
        app.set_accels_for_action("app.copy", &["F5"]);
        app.add_action_entries([action_copy]);

        let action_move = ActionEntry::builder("move")
            .activate(clone!(#[weak]webview, move |_, _, _|{
                webview.evaluate_javascript("menuAction('MOVE')", None, None, None::<&Cancellable>, |_|{});
                webview.grab_focus();
            }))
            .build();
        app.set_accels_for_action("app.move", &["F6"]);
        app.add_action_entries([action_move]);

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

        let action_delete = ActionEntry::builder("delete")
            .activate(clone!(#[weak]webview, move |_, _, _|{
                webview.evaluate_javascript("menuAction('DELETE')", None, None, None::<&Cancellable>, |_|{});
                webview.grab_focus();
            }))
            .build();
        app.set_accels_for_action("app.delete", &["Delete"]);
        app.add_action_entries([action_delete]);

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

        let (sender, receiver) = async_channel::unbounded();
        set_progress_sender(sender);
        let progress_display: ProgressDisplay = builder.object("progressdisplay").unwrap();

        glib::spawn_future_local(clone!(
            #[weak] progress_display, 
            async move {
                while let Ok(progress) = receiver.recv().await {
                    progress.display_progress(&progress_display);
                }
            }));        
    }
}

