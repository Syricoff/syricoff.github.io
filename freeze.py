from flask_frozen import Freezer

from app import app, repository

freezer = Freezer(app)


@freezer.register_generator
def project():
    for item in repository.list_projects():
        yield {"slug": item.slug}


if __name__ == "__main__":
    freezer.freeze()
