use glib::Object;
use gtk::{glib, subclass::prelude::ObjectSubclassIsExt, Accessible, Buildable, ConstraintTarget, Orientable, Widget};

mod imp;

glib::wrapper! {
    pub struct ProgressDisplay(ObjectSubclass<imp::ProgressDisplay>)
        @extends gtk::Box, Widget,
        @implements Accessible, Buildable, ConstraintTarget, Orientable;
}

impl ProgressDisplay {
    pub fn new() -> Self {
        Object::builder()
        .build()
    }

	pub fn reveal(&self) {
        let inner = self.imp();
        inner.revealer.set_reveal_child(true);
        // self.connect_number_notify(|button| {
        //     println!("The current number of `button_1` is {}.", button.number());
        // });
    }
}

impl Default for ProgressDisplay {
    fn default() -> Self {
        Self::new()
    }
}