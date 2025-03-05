from Docs.config.name_mapping import NAME_MAPPING

def get_real_name(username):
    return NAME_MAPPING.get(username, username)
