use std::cell::RefCell;
use std::time::Duration;
use std::{cell::Cell, f64::consts::PI};
use gtk::glib::{clone, spawn_future_local, timeout_future, Properties};
use gtk::{glib, CompositeTemplate, DrawingArea, Label, ProgressBar, Revealer};
use gtk::prelude::*;
use gtk::subclass::prelude::*;

use crate::str::SizeExt;

#[derive(Default, CompositeTemplate, Properties)]
#[properties(wrapper_type = super::ProgressDisplay)]
#[template(resource = "/de/uriegel/commander/progress_display.ui")]
pub struct ProgressDisplay {
	#[template_child]
    pub revealer: TemplateChild<Revealer>,	
	#[template_child]
    pub progress_area: TemplateChild<DrawingArea>,	
	#[template_child]
    pub progress_bar_total: TemplateChild<ProgressBar>,	
	#[template_child]
    pub progress_bar_current: TemplateChild<ProgressBar>,	
	#[template_child]
    pub current_name_label: TemplateChild<Label>,	
	#[template_child]
    pub count_label: TemplateChild<Label>,	
	#[template_child]
    pub total_count_label: TemplateChild<Label>,	
	#[template_child]
    pub size_label: TemplateChild<Label>,	
	#[template_child]
    pub title_label: TemplateChild<Label>,	
	#[template_child]
    pub duration_label: TemplateChild<Label>,	
	#[template_child]
    pub estimated_duration_label: TemplateChild<Label>,	
    #[property(get, set)]
    total_progress: Cell<f64>,	
    #[property(get, set)]
    total_bytes: Cell<f64>,	
	#[property(get, set)]
    current_progress: Cell<f64>,	
	#[property(get, set)]
    is_active: Cell<bool>,
    #[property(get, set)]
    current_name: RefCell<String>,	
    #[property(get, set)]
    total_count: Cell<i32>,	
    #[property(get, set)]
    current_count: Cell<i32>,	
    #[property(get, set)]
    size: Cell<u64>,	
    #[property(get, set)]
    mov: Cell<bool>,	
    #[property(get, set)]
    duration: Cell<i32>,	
    #[property(get, set)]
    estimated_duration: Cell<i32>,	
}

#[glib::object_subclass]
impl ObjectSubclass for ProgressDisplay {
    const NAME: &'static str = "ProgressDisplay";
    type Type = super::ProgressDisplay;
    type ParentType = gtk::Box;

	fn class_init(klass: &mut Self::Class) {
		klass.bind_template();
	}

	fn instance_init(obj: &glib::subclass::InitializingObject<Self>) {
		obj.init_template();
	}
}

// Trait shared by all GObjects
#[glib::derived_properties]
impl ObjectImpl for ProgressDisplay {

	fn constructed(&self) {
		self.parent_constructed();

        self.obj().connect_total_progress_notify(|pd| {
            if !pd.is_active() {
                pd.set_is_active(true);
                pd.imp().revealer.set_reveal_child(true);
            }
            if pd.total_progress() == 1.0 {
                pd.set_is_active(false);
                spawn_future_local(clone!(
                    #[weak] pd,async move {
                    timeout_future(Duration::from_secs(10)).await;                
                    if !pd.is_active() {
                        pd.imp().revealer.set_reveal_child(false);
                    }
                }));
            }
            pd.imp().progress_area.queue_draw()
        });

        self.obj()
            .bind_property::<ProgressBar>("total_progress", self.progress_bar_total.as_ref(), "fraction")
            .sync_create()
            .build();
        self.obj()
            .bind_property::<ProgressBar>("current_progress", self.progress_bar_current.as_ref(), "fraction")
            .sync_create()
            .build();
        self.obj()
            .bind_property::<Label>("current_name", self.current_name_label.as_ref(), "label")
            .sync_create()
            .build();
        self.obj()
            .bind_property::<Label>("current_count", self.count_label.as_ref(), "label")
            .sync_create()
            .build();
        self.obj()
            .bind_property::<Label>("total_count", self.total_count_label.as_ref(), "label")
            .transform_to(|_, count: i32| {
                Some(format!("/{}", count))
            })
           .sync_create()
            .build();
        self.obj()
            .bind_property::<Label>("size", self.size_label.as_ref(), "label")
            .transform_to(|_, count: u64| {
                Some((count as usize).byte_count_to_string()) 
            })
           .sync_create()
            .build();
        self.obj()
            .bind_property::<Label>("mov", self.title_label.as_ref(), "label")
            .transform_to(|_, mov: bool| {
                Some(if mov { "Fortschritt beim Verschieben" } else { "Fortschritt beim Kopieren" }) 
            })
           .sync_create()
            .build();
        self.obj()
            .bind_property::<Label>("duration", self.duration_label.as_ref(), "label")
            .transform_to(|_, duration: i32| {
                Some(seconds_to_time(duration)) 
            })
           .sync_create()
            .build();
        self.obj()
            .bind_property::<Label>("estimated_duration", self.estimated_duration_label.as_ref(), "label")
            .transform_to(|_, duration: i32| {
                Some(seconds_to_time(duration)) 
            })
           .sync_create()
            .build();

        let pd = self.obj().clone();
        self.progress_area.set_draw_func(move|_, c, w, h|{
            let progress = pd.total_progress();
            let fill_color = if progress == 1.0 { RGB { red: 0.7, green: 0.7, blue: 0.7 }} else { RGB { red: 0.25, green: 0.63, blue: 0.89}};

            c.set_antialias(gtk::cairo::Antialias::Best);
            c.set_line_join(gtk::cairo::LineJoin::Miter);
            c.set_line_cap(gtk::cairo::LineCap::Round);
            c.translate(w as f64 / 2.0, h as f64 /2.0);
            let _ = c.stroke_preserve();
            c.arc_negative(0.0, 0.0, (if w < h {w} else {h}) as f64 / 2.0, -PI/2.0, -PI/2.0 + f64::max(progress, 0.01)*PI*2.0);
            c.line_to(0.0, 0.0);
            //c.set_source_rgb(0.7, 0.7, 0.7);
            c.set_source_rgb(1.0, 1.0, 1.0);
            //c.set_source_rgb(0.2, 0.2, 0.2);// TODO dark theme: gsettings get org.gnome.desktop.interface gtk-theme
            let _ = c.fill();
            c.move_to(0.0, 0.0);
            c.arc(0.0, 0.0, (if w < h {w} else {h}) as f64 / 2.0, -PI/2.0, -PI/2.0 + f64::max(progress, 0.01)*PI*2.0);
            c.set_source_rgb(fill_color.red, fill_color.green, fill_color.blue);
            let _ = c.fill();
        });
    }	
}

// Trait shared by all widgets
impl WidgetImpl for ProgressDisplay {}

// Trait shared by all boxes
impl BoxImpl for ProgressDisplay {}

struct RGB {
    red: f64,
    green: f64,
    blue: f64
}

fn seconds_to_time(s: i32)->String {
    let secs = s % 60;
    let min = s / 60;
    format!("{:0>2}:{:0>2}", min, secs)
}
