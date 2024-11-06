impl Progresses {
    pub fn display_progress(&self, display: &ProgressDisplay) {
        match self {
            Progresses::Start(start) => {
                display.set_total_count(start.total_files as i32);        
                display.set_size(start.total_size);
                display.set_total_progress(0.0);
            } 
            Progresses::Files(files) => {
                display.set_current_count(files.current_files as i32);        
                display.set_current_name(files.current_name.clone());
                display.set_total_progress(files.progress);
            } 
            Progresses::File(file) => {
                let total_progress = file.total.current as f64 / file.total.total as f64;
                display.set_total_progress(total_progress);
                let progress = file.current.current as f64 / file.current.total as f64;
                display.set_current_progress(progress);
            } 
        }
    }
}
