const fetch = require("node-fetch");
const express = require("express");

const URL = "https://api.meetup.com";
const PAGE = 200;

let app = express();

app.get("/membership", async (req, res) => {
  const { meetups } = req.query;
  if (meetups) {
    try {
      let result = await fetchMemberships(meetups.split(","));
      res.send(flatten(result));
    } catch (e) {
      res.status(500).send(e);
    }
  } else {
    res.status(500).send({ msg: "Parameter {meetups} missing." });
  }
});

const fetchMemberships = meetups => {
  return Promise.all(meetups.map(fetchMembership));
};

const fetchMembership = meetup => {
  return fetchMeetup(meetup).then(m => {
    if (!m.members) {
      console.error(`Error fetching ${meetup} info ${JSON.stringify(m)}`);
      return Promise.resolve([]);
    }
    let pages = Math.floor(m.members / PAGE) + 1;
    return Promise.all(
      Array.from(new Array(pages), (val, idx) => {
        return fetchMeetupMembers(m.urlname, PAGE, idx).then(
          mapMembership.bind(this, m)
        );
      })
    );
  });
};

const mapMembership = (meetup, members) => {
  return members.map(member => {
    return {
      member: member,
      meetup: meetup
    };
  });
};

const fetchMeetup = meetup => {
  return fetch(`${URL}/${meetup}?fields=topics`).then(r => r.json());
};

const fetchMeetupMembers = (meetup, page, offset) => {
  page = page || PAGE;
  offset = offset || 0;
  return fetch(`${URL}/${meetup}/members?page=${page}&offset=${offset}`).then(
    r => r.json()
  );
};
const flatten = arr =>
  arr.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []);

app.listen(8080);
