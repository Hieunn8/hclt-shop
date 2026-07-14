export default {
  index() {
    return { ok: true, service: "cms", time: new Date().toISOString() };
  }
};
