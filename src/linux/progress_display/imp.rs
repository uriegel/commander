use std::cell::Cell;

use gtk::glib::Properties;
use gtk::{glib, CompositeTemplate, Revealer};
use gtk::prelude::*;
use gtk::subclass::prelude::*;

#[derive(Default, CompositeTemplate, Properties)]
#[properties(wrapper_type = super::ProgressDisplay)]
#[template(resource = "/de/uriegel/commander/progress_display.ui")]
pub struct ProgressDisplay {
	#[template_child]
    pub revealer: TemplateChild<Revealer>,	
	#[property(get, set)]
    number: Cell<i32>,	
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

        // Access the wrapper type from the implementation struct
		let wrapper: &super::ProgressDisplay = unsafe { &*(self as *const _ as *const super::ProgressDisplay) };


		wrapper.connect_number_notify(|obj| {
            let number = obj.number();
            println!("Number changed to: {}", number);
        });
        // Connect to notify signal for the 'number' property
        // wrapper.connect_notify(Some("number"), move |obj, _| {
        //     let number = obj.number();
        //     println!("Number changed to: {}", number);
        // });
    }	
		
	// 	// self.connect_number_notify(|button| {
    //     //     println!("The current number of `button_1` is {}.", button.number());
    //     // });
	// }
}

// Trait shared by all widgets
impl WidgetImpl for ProgressDisplay {}

// Trait shared by all boxes
impl BoxImpl for ProgressDisplay {}


