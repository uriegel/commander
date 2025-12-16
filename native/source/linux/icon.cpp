#include <fstream>
#include <napi.h>
#include "../get_icon_worker.h"
#include <gio/gio.h>
#include <gtk/gtk.h>
#include <iostream>
#include <thread>
#include <chrono>
using namespace Napi;
using namespace std;

GtkIconTheme* default_theme{nullptr};

void checkInitializeIcons() {
    if (!default_theme) {
// #ifdef DEBUG
//         int argc{0};
//         gtk_init(&argc, (char***)nullptr);
// #endif
        default_theme = gtk_icon_theme_get_default();
    }
}

vector<char> get_icon(const string& extension) {
    auto type = g_content_type_guess(extension.c_str(), nullptr, 0, nullptr);
    auto icon = g_content_type_get_icon(type);
    if (type)
        g_free(type);
    auto names = g_themed_icon_get_names((GThemedIcon*)icon);
    auto icon_info = gtk_icon_theme_choose_icon(default_theme, (const gchar**)names, 16, (GtkIconLookupFlags)0);
    if (icon_info == nullptr)
        cout << "icon_info is null" << endl;
    if (icon)
        g_object_unref(icon);
    auto filename = gtk_icon_info_get_filename(icon_info);
    auto filename_char = (char *)filename;
    if (icon_info == nullptr && filename_char != nullptr)
        cout << "icon file" << " - " << filename_char << endl;
    if (filename_char == nullptr)
        cout << "icon file is null" << endl;

    if (filename_char == nullptr || strncmp(filename_char, "/org/gkt", 8) == 0) {
        cout << "try again" << endl;
        this_thread::sleep_for(chrono::milliseconds(200));
        type = g_content_type_guess(extension.c_str(), nullptr, 0, nullptr);
        icon = g_content_type_get_icon(type);
        if (type)
            g_free(type);
        names = g_themed_icon_get_names((GThemedIcon*)icon);
        icon_info = gtk_icon_theme_choose_icon(default_theme, (const gchar**)names, 16, (GtkIconLookupFlags)0);
        if (icon)
            g_object_unref(icon);
        filename = gtk_icon_info_get_filename(icon_info);
    }
    ifstream input(filename, ios::binary);
    vector<char> result(istreambuf_iterator<char>(input), {});
    // if (icon_info)
    //     g_object_unref(icon_info);
    return result;
}

vector<char> get_icon_from_name(const string& name) {
    auto icon = g_content_type_get_icon(name.c_str());
    auto names = g_themed_icon_get_names((GThemedIcon*)icon);
    auto icon_info = gtk_icon_theme_choose_icon(default_theme, (const gchar**)names, 16, (GtkIconLookupFlags)0);
    if (icon_info == nullptr)
        cout << "icon_info is null" << endl;
    if (icon)
        g_object_unref(icon);
    auto filename = gtk_icon_info_get_filename(icon_info);
    auto filename_char = (char *)filename;
    if (icon_info == nullptr && filename_char != nullptr)
        cout << "icon file" << " - " << filename_char << endl;
    if (filename_char == nullptr)
        cout << "icon file is null" << endl;

    if (filename_char == nullptr || strncmp(filename_char, "/org/gkt", 8) == 0) {
        cout << "try again" << endl;
        this_thread::sleep_for(chrono::milliseconds(200));
        icon = g_content_type_get_icon(name.c_str());
        names = g_themed_icon_get_names((GThemedIcon*)icon);
        icon_info = gtk_icon_theme_choose_icon(default_theme, (const gchar**)names, 16, (GtkIconLookupFlags)0);
        if (icon)
            g_object_unref(icon);
        filename = gtk_icon_info_get_filename(icon_info);
    }
    ifstream input(filename, ios::binary);
    vector<char> result(istreambuf_iterator<char>(input), {});
    // if (icon_info)
    //     g_object_unref(icon_info);
    return result;
}

GdkPixbuf* load_app_icon_gtk3_compat(GAppInfo *app)
{
    GIcon *icon = g_app_info_get_icon(app);
    if (!icon) 
        return nullptr;
        
    GError *error = nullptr;
    if (G_IS_THEMED_ICON(icon)) {
        GtkIconTheme *theme = gtk_icon_theme_get_default();

        auto names = g_themed_icon_get_names(G_THEMED_ICON(icon));

        for (int i = 0u; names[i]; i++) {
            GdkPixbuf *pixbuf =
                gtk_icon_theme_load_icon(
                    theme,
                    names[i],
                    32,
                    GTK_ICON_LOOKUP_FORCE_SIZE,
                    &error
                );

            if (pixbuf) 
                return pixbuf;

            if (error)
                g_error_free(error);
        }
    } else if (G_IS_FILE_ICON(icon)) {
        GFile *file = g_file_icon_get_file(G_FILE_ICON(icon));
        char *path = g_file_get_path(file);

        if (path) {
            GdkPixbuf *pixbuf =
                gdk_pixbuf_new_from_file_at_size(
                    path,
                    32,
                    32,
                    &error
                );
            g_free(path);

            if (pixbuf)
                return pixbuf;

            if (error) {
                g_error_free(error);
                error = NULL;
            }
        }
    }
    return nullptr;
}

vector<char> get_app_icon(GAppInfo* app) {
    auto pixbuf = load_app_icon_gtk3_compat(app);
    gchar *buffer = nullptr;
    gsize size = 0;
    gdk_pixbuf_save_to_buffer(pixbuf, &buffer, &size, "png", nullptr, nullptr);
    vector<char> result;
    for (auto i = 0u; i < size; i++)
        result.push_back(buffer[i]);
    g_free(buffer);
    return result;
}

