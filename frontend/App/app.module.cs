.app {
  width: 100vw;

  /* make footer always on bottom */
  min-height: 100vh; /* page height is at least page height */
  display: flex;
  flex-direction: column;
}

.app main {
  
  flex: 1; /* stretch main above footer */

  width: 80%;
  max-width: 1000px;
  margin: 0 auto;
}
