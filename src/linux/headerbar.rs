use std::f64::consts::PI;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

use async_channel::Sender;
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


                // TODO TEST Revealer progress
                std::thread::spawn(|| {
                    thread::sleep(Duration::from_secs(5));
                    let sender = get_sender().lock().unwrap();
                    let _ = sender.send_blocking(Progress::Start);
                    thread::sleep(Duration::from_secs(5));
                    let _ = sender.send_blocking(Progress::Stop);
                    thread::sleep(Duration::from_secs(5));
                    let _ = sender.send_blocking(Progress::Drop);
                });




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
        let revealer: gtk::Revealer = builder.object("revealer").unwrap();
        let progress_area: gtk::DrawingArea = builder.object("progressarea").unwrap();
        let progress = 0.4;
        progress_area.set_draw_func(move|_, c, w, h|{
            c.set_antialias(gtk::cairo::Antialias::Best);
            c.set_line_join(gtk::cairo::LineJoin::Miter);
            c.set_line_cap(gtk::cairo::LineCap::Round);
            c.translate(w as f64 / 2.0, h as f64 /2.0);
            let _ = c.stroke_preserve();
            c.arc_negative(0.0, 0.0, (if w < h {w} else {h}) as f64 / 2.0, -PI/2.0, -PI/2.0 + f64::max(progress, 0.01)*PI*2.0);
            c.line_to(0.0, 0.0);
            c.set_source_rgb(0.7, 0.7, 0.7);
            let _ = c.fill();
            c.move_to(0.0, 0.0);
            c.arc(0.0, 0.0, (if w < h {w} else {h}) as f64 / 2.0, -PI/2.0, -PI/2.0 + f64::max(progress, 0.01)*PI*2.0);
            c.set_source_rgb(0.0, 0.0, 1.0);
            let _ = c.fill();
        });

        glib::spawn_future_local(clone!(
            #[weak] revealer, 
            #[weak] progress_area, 
            async move {
                while let Ok(progress) = receiver.recv().await {
                    match progress {
                        Progress::Start => revealer.set_reveal_child(true),    
                        Progress::Stop => {
                            progress_area.queue_draw();
                        },    
                        Progress::Drop => revealer.set_reveal_child(false),    
                    }
                }
            }));        
    }
}

enum Progress {
    Start,
    Stop,
    Drop
}

fn set_progress_sender(snd: Sender<Progress>) {
    unsafe { PROGRESS_SENDER = Some(Arc::new(Mutex::new(snd))) };
}

fn get_sender()->&'static Arc<Mutex<Sender<Progress>>> {
    unsafe {
        PROGRESS_SENDER.as_ref().unwrap()        
    }
}

static mut PROGRESS_SENDER: Option<Arc<Mutex<Sender<Progress>>>> = None;