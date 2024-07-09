import nodemailer from "nodemailer";
import "dotenv/config";
import constants from "./constants.js";

const imgUrl = `https://images.pexels.com/photos/359989/pexels-photo-359989.jpeg?auto=compress&cs=tinysrgb&w=300&h=100&dpr=2`;

// https://stackoverflow.com/a/8888498
function formatAMPM(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? "0" + minutes : minutes;
  var strTime = hours + ":" + minutes + " " + ampm;
  return strTime;
}

function parseDate(str) {
  const parts = str.split("/");
  return new Date("20" + parts[2], parts[1] - 1, parts[0]); // JS months start at 0
}

async function sendMiddleSchool(toEmail, toName, subject, content) {
  const transporter = nodemailer.createTransport({
    host: "smtp-mail.outlook.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.MS_EMAIL,
      pass: process.env.MS_PASSWORD,
    },
  });

  const message = `Dear ${toName},
    ${content}

    Regards,
    ${process.env.MS_NAME}
    Middle school executive assistant`;

  const messageHTML = `<b>Dear ${toName},</b>
    <p>${content}</p>
    <img src="${imgUrl}"/>
    <b>
    <p>Regards,</p>
    <p style="margin-top: 0;">${process.env.MS_NAME}</p>
    <p style="margin-top: 0;">Middle school executive assistant</p>
    </b>
    `;
  const info = await transporter.sendMail({
    from: `"${process.env.MS_NAME}" <${process.env.MS_EMAIL}>`,
    to: process.env.PROD ? toEmail : process.env.TEST_RECIEVER,
    subject,
    text: message,
    html: messageHTML,
  });
}

async function sendSeniorSchool(toEmail, toName, subject, content) {
  const transporter = nodemailer.createTransport({
    host: "smtp-mail.outlook.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.SS_EMAIL,
      pass: process.env.SS_PASSWORD,
    },
  });

  const message = `Dear ${toName},
    ${content}

    Regards,
    ${process.env.SS_NAME}
    Senior school executive assistant`;

  const messageHTML = `<b>Dear ${toName},</b>
    <p>${content}</p>
    <img src="${imgUrl}"/>
    <b>
    <p>Regards,</p>
    <p style="margin-top: 0;">${process.env.SS_NAME}</p>
    <p style="margin-top: 0;">Senior school executive assistant</p>
    </b>
    `;
  const info = await transporter.sendMail({
    from: `"${process.env.SS_NAME}" <${process.env.SS_EMAIL}>`,
    to: process.env.PROD ? toEmail : process.env.TEST_RECIEVER,
    subject,
    text: message,
    html: messageHTML,
  });
}

function isSenior(student) {
  return student.grade >= 9;
}

export function numTimesLate(student) {
  let cutoffDate;
  if (isSenior(student)) {
    const now = new Date();
    if (parseDate(constants.semesters[1]) < now) {
      // currently 2nd semester going on
      cutoffDate = parseDate(constants.semesters[1]);
    } else {
      // currently 1st sem
      cutoffDate = parseDate(constants.semesters[0]);
    }
  } else {
    const now = new Date();
    now.setDate(1); // first day of current month
    cutoffDate = now;
  }
  const recentArrivals = student.lateArrivals.filter(
    (arrival) => arrival.arrivalTime > cutoffDate
  );
  return recentArrivals.length;
}

export async function sendTeachers(student) {
  const arrival = student.lateArrivals.slice(-1)[0];
  student.teachers.forEach((teacher) => {
    const content = `Kindly excuse your student ${
      student.name
    } for coming late to class today. They entered ${
      arrival.building
    } at ${formatAMPM(arrival.arrivalTime)} and were late because of ${
      arrival.reason
    }.`;
    const subject = `Late arrival of ${student.name}`;
    isSenior(student)
      ? sendSeniorSchool(teacher.email, teacher.name, subject, content)
      : sendMiddleSchool(teacher.email, teacher.name, subject, content);
  });
}

export async function sendGuardiansAndStudent(student) {
  if (numTimesLate(student) !== 3) return;
  student.guardians.forEach((guardian) => {
    const content = `Your ward, ${
      student.name
    } has reached school late 3 times this ${
      isSenior(student) ? "semester" : "month"
    }. Please ensure that your ward leaves home on time. If they are late another time this ${
      isSenior(student) ? "semester" : "month"
    }, they will be sent back home.`;
    const subject = `Tardiness of ${student.name}`;
    isSenior(student)
      ? sendSeniorSchool(guardian.email, guardian.name, subject, content)
      : sendMiddleSchool(guardian.email, guardian.name, subject, content);
  });
  const content = `You have reached school late 3 times this ${
    isSenior(student) ? "semester" : "month"
  }. Please ensure that you leave home on time. If you are late another time this ${
    isSenior(student) ? "semester" : "month"
  }, you will be sent back home.`;
  const subject = `Tardiness to school`;
  isSenior(student)
    ? sendSeniorSchool(student.email, student.name, subject, content)
    : sendMiddleSchool(student.email, student.name, subject, content);
}
