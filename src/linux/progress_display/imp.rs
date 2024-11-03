use std::{cell::Cell, f64::consts::PI};
use gtk::glib::Properties;
use gtk::{glib, CompositeTemplate, DrawingArea, Revealer};
use gtk::prelude::*;
use gtk::subclass::prelude::*;

#[derive(Default, CompositeTemplate, Properties)]
#[properties(wrapper_type = super::ProgressDisplay)]
#[template(resource = "/de/uriegel/commander/progress_display.ui")]
pub struct ProgressDisplay {
	#[template_child]
    pub revealer: TemplateChild<Revealer>,	
	#[template_child]
    pub progress_area: TemplateChild<DrawingArea>,	
	#[property(get, set)]
    total_progress: Cell<f64>,	
	#[property(get, set)]
    current_progress: Cell<f64>,	
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
            if !pd.imp().revealer.is_child_revealed() {
                pd.imp().revealer.set_reveal_child(true);
            }
            pd.imp().progress_area.queue_draw();
        });

        let pd = self.obj().clone();
        self.progress_area.set_draw_func(move|_, c, w, h|{
            c.set_antialias(gtk::cairo::Antialias::Best);
            c.set_line_join(gtk::cairo::LineJoin::Miter);
            c.set_line_cap(gtk::cairo::LineCap::Round);
            c.translate(w as f64 / 2.0, h as f64 /2.0);
            let _ = c.stroke_preserve();
            c.arc_negative(0.0, 0.0, (if w < h {w} else {h}) as f64 / 2.0, -PI/2.0, -PI/2.0 + f64::max(pd.total_progress(), 0.01)*PI*2.0);
            c.line_to(0.0, 0.0);
            c.set_source_rgb(0.7, 0.7, 0.7);
            let _ = c.fill();
            c.move_to(0.0, 0.0);
            c.arc(0.0, 0.0, (if w < h {w} else {h}) as f64 / 2.0, -PI/2.0, -PI/2.0 + f64::max(pd.total_progress(), 0.01)*PI*2.0);
            c.set_source_rgb(0.0, 0.0, 1.0);
            let _ = c.fill();
        });
    
    }	
}

// Trait shared by all widgets
impl WidgetImpl for ProgressDisplay {}

// Trait shared by all boxes
impl BoxImpl for ProgressDisplay {}
