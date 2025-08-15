from myapp import app, db
from models import Therapist, TherapistAvailability, Resource
from datetime import datetime

def seed_data():
    with app.app_context():
        # Clear existing data (optional)
        TherapistAvailability.query.delete()
        Therapist.query.delete()
        Resource.query.delete()
        db.session.commit()

        # Add therapists
        therapists = [
            Therapist(
                name="Dr. Jane Smith",
                photo_url="https://randomuser.me/api/portraits/women/44.jpg",
                specialization="Anxiety, Depression",
                qualifications="PhD Clinical Psychology",
                contact="janesmith@example.com",
                location="Sydney, Australia"
            ),
            Therapist(
                name="Dr. John Doe",
                photo_url="https://randomuser.me/api/portraits/men/46.jpg",
                specialization="Stress Management, PTSD",
                qualifications="MD Psychiatry",
                contact="johndoe@example.com",
                location="Melbourne, Australia"
            ),
        ]

        for t in therapists:
            db.session.add(t)
        db.session.commit()

        # Fetch saved therapists to add availability
        jane = Therapist.query.filter_by(name="Dr. Jane Smith").first()
        john = Therapist.query.filter_by(name="Dr. John Doe").first()

        # Add availability
        availability = [
            TherapistAvailability(therapist_id=jane.id, day="Monday", slot="09:00"),
            TherapistAvailability(therapist_id=jane.id, day="Monday", slot="10:00"),
            TherapistAvailability(therapist_id=jane.id, day="Monday", slot="14:00"),
            TherapistAvailability(therapist_id=jane.id, day="Wednesday", slot="11:00"),
            TherapistAvailability(therapist_id=jane.id, day="Wednesday", slot="13:00"),

            TherapistAvailability(therapist_id=john.id, day="Tuesday", slot="09:30"),
            TherapistAvailability(therapist_id=john.id, day="Tuesday", slot="12:00"),
            TherapistAvailability(therapist_id=john.id, day="Tuesday", slot="15:00"),
            TherapistAvailability(therapist_id=john.id, day="Thursday", slot="10:00"),
            TherapistAvailability(therapist_id=john.id, day="Thursday", slot="14:30"),
        ]

        for a in availability:
            db.session.add(a)
        db.session.commit()

        # Add example resources
        resources = [
            Resource(
                title="Understanding Anxiety",
                summary="An article explaining anxiety and ways to manage it.",
                url="https://www.example.com/anxiety",
                source="MedlinePlus",
                resource_type="article",
                tags="anxiety, mental health, coping",
                verified=True,
                published_at=datetime(2023, 3, 15)
            ),
            Resource(
                title="Stress Management Techniques",
                summary="A video guide on effective stress management.",
                url="https://www.youtube.com/watch?v=stress123",
                source="YouTube",
                resource_type="video",
                tags="stress, relaxation, mental health",
                verified=False,
                published_at=datetime(2023, 1, 10)
            ),

            # Added 4 more resources here:
            Resource(
                title="Mindfulness Meditation for Anxiety",
                summary="A comprehensive guide on how mindfulness meditation can help reduce anxiety.",
                url="https://www.mindful.org/mindfulness-meditation-for-anxiety/",
                source="Mindful.org",
                resource_type="article",
                tags="mindfulness, anxiety, meditation",
                published_at=datetime(2023, 3, 15),
                verified=True
            ),
            Resource(
                title="Understanding Depression",
                summary="An easy-to-understand overview of depression symptoms, causes, and treatment options.",
                url="https://www.nimh.nih.gov/health/topics/depression",
                source="NIMH",
                resource_type="article",
                tags="depression, mental health, symptoms",
                published_at=datetime(2022, 11, 20),
                verified=True
            ),
            Resource(
                title="Cognitive Behavioral Therapy (CBT) Explained",
                summary="An introduction to CBT techniques used to treat various mental health issues.",
                url="https://www.psychologytools.com/resource/cognitive-behavioural-therapy-cbt-explained/",
                source="Psychology Tools",
                resource_type="article",
                tags="CBT, therapy, mental health",
                published_at=datetime(2023, 6, 5),
                verified=False
            ),
            Resource(
                title="Guided Relaxation and Deep Breathing",
                summary="A video demonstrating simple deep breathing exercises to reduce stress.",
                url="https://www.youtube.com/watch?v=1vx8iUvfyCY",
                source="YouTube",
                resource_type="video",
                tags="relaxation, breathing, stress relief",
                published_at=datetime(2023, 1, 10),
                verified=True
            ),
        ]

        for r in resources:
            db.session.add(r)
        db.session.commit()

        print("Seeding complete!")

if __name__ == "__main__":
    seed_data()
