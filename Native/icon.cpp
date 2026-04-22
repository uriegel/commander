#include <gtk/gtk.h>
#include <string>
#include <vector>
#include <iostream>
#include <cstdio>
#include <cstdlib>
#include <chrono>
#include <fstream>
#include <thread>
using namespace std;

GtkIconTheme* default_theme{nullptr};

void checkInitializeIcons() {
    if (!default_theme) 
        default_theme = gtk_icon_theme_get_default();
}

vector<char> get_icon_from_name(const string& name) {
    auto icon = g_content_type_get_icon(name.c_str());
    auto names = g_themed_icon_get_names((GThemedIcon*)icon);
    auto icon_info = gtk_icon_theme_choose_icon(default_theme, (const gchar**)names, 16, (GtkIconLookupFlags)0);
    if (icon_info == nullptr)
        cerr << "icon_info is null" << endl;
    if (icon)
        g_object_unref(icon);
    auto filename = gtk_icon_info_get_filename(icon_info);
    auto filename_char = (char *)filename;
    if (icon_info == nullptr && filename_char != nullptr)
        cout << "icon file" << " - " << filename_char << endl;
    if (filename_char == nullptr)
        cerr << "icon file is null" << endl;

    if (filename_char == nullptr || strncmp(filename_char, "/org/gkt", 8) == 0) {
        cerr << "try again" << endl;
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

vector<char> get_icon_from_extension(const string& extension) {
    auto type = g_content_type_guess(extension.c_str(), nullptr, 0, nullptr);
    auto icon = g_content_type_get_icon(type);
    if (type)
        g_free(type);
    auto names = g_themed_icon_get_names((GThemedIcon*)icon);
    auto icon_info = gtk_icon_theme_choose_icon(default_theme, (const gchar**)names, 16, (GtkIconLookupFlags)0);
    if (icon_info == nullptr)
        cerr << "icon_info is null" << endl;
    if (icon)
        g_object_unref(icon);
    auto filename = gtk_icon_info_get_filename(icon_info);
    auto filename_char = (char *)filename;
    if (icon_info == nullptr && filename_char != nullptr)
        cerr << "icon file" << " - " << filename_char << endl;
    if (filename_char == nullptr)
        cerr << "icon file is null" << endl;

    if (filename_char == nullptr || strncmp(filename_char, "/org/gkt", 8) == 0) {
        cerr << "try again" << endl;
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

int main (int argc, char **argv)
{
    gtk_init(&argc, &argv);
    checkInitializeIcons();

    string name;
    while (getline(cin, name)) {
        //string name = "network-server"s;
        vector<char> result = name.starts_with("ext:") ? get_icon_from_extension(name.substr(4)) : get_icon_from_name(name);

        // Write size-prefixed frame: 8-byte total length (uint64 little-endian) then payload
        uint64_t total = result.size();
        char header[8];
        for (int i = 0; i < 8; ++i) 
            header[i] = static_cast<char>((total >> (8*i)) & 0xFF);

        if (fwrite(header, 1, 8, stdout) != 8) 
        { 
            std::perror("fwrite"); 
            return EXIT_FAILURE; 
        }
        if (fwrite(result.data(), 1, result.size(), stdout) != result.size()) 
        { 
            std::perror("fwrite"); 
            return EXIT_FAILURE; 
        }
        if (fflush(stdout) != 0) 
        { 
            std::perror("fflush"); 
            return EXIT_FAILURE; 
        }
    }
}

// TODO compile with
// g++ icon.cpp -o icon -std=c++20 `pkg-config --cflags --libs gtk+-3.0`
