use gtk::{glib, CompositeTemplate};
use gtk::subclass::prelude::*;

#[derive(Default, CompositeTemplate)]
#[template(resource = "/de/uriegel/commander/progress_display.ui")]
 pub struct ProgressDisplay;

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
impl ObjectImpl for ProgressDisplay {}

// Trait shared by all widgets
impl WidgetImpl for ProgressDisplay {}

// Trait shared by all boxes
impl BoxImpl for ProgressDisplay {}


