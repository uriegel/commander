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
}

impl Default for ProgressDisplay {
    fn default() -> Self {
        Self::new()
    }
}