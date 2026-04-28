/*
  RoomMap.jsx
  -----------
  ׳§׳•׳׳₪׳•׳ ׳ ׳˜׳” ׳׳”׳¦׳’׳× ׳׳₪׳× ׳”׳¡׳₪׳¨׳™׳™׳” ׳‘׳¦׳•׳¨׳” ׳׳™׳ ׳˜׳¨׳׳§׳˜׳™׳‘׳™׳× ׳•׳׳¡׳•׳“׳¨׳×.
*/

const seatData = [
  /* Reading Table A */
  { id: "R1-1", area: "reading", x: "15.8%", y: "36.5%", status: "available" },
  { id: "R1-2", area: "reading", x: "24.2%", y: "36.5%", status: "reserved" },
  { id: "R1-3", area: "reading", x: "12.6%", y: "52.5%", status: "available" },
  { id: "R1-4", area: "reading", x: "21.2%", y: "52.5%", status: "reserved" },

  /* Reading Table B */
  { id: "R2-1", area: "reading", x: "14.8%", y: "67.5%", status: "available" },
  { id: "R2-2", area: "reading", x: "22.4%", y: "67.5%", status: "available" },
  { id: "R2-3", area: "reading", x: "14.0%", y: "76.2%", status: "reserved" },
  { id: "R2-4", area: "reading", x: "22.0%", y: "76.2%", status: "available" },

  /* Reading Table C */
  { id: "R3-1", area: "reading", x: "28.2%", y: "36.5%", status: "available" },
  { id: "R3-2", area: "reading", x: "35.8%", y: "36.5%", status: "available" },
  { id: "R3-3", area: "reading", x: "28.4%", y: "52.5%", status: "available" },
  { id: "R3-4", area: "reading", x: "35.8%", y: "52.5%", status: "reserved" },

  /* Computer Desk A - 4 stations / 4 seats */
  { id: "C1-1", area: "computer", x: "45.6%", y: "52.2%", status: "available" },
  { id: "C1-2", area: "computer", x: "53.6%", y: "32.5%", status: "reserved" },
  { id: "C1-3", area: "computer", x: "48.6%", y: "52.2%", status: "available" },
  { id: "C1-4", area: "computer", x: "53.6%", y: "52.2%", status: "available" },
  { id: "C1-5", area: "computer", x: "46.6%", y: "52.2%", status: "available" },

  /* Computer Desk B - 3 stations / 3 seats */
  { id: "C2-1", area: "computer", x: "47.2%", y: "70.2%", status: "available" },
  { id: "C2-2", area: "computer", x: "51.1%", y: "70.2%", status: "available" },
  { id: "C2-3", area: "computer", x: "47.2%", y: "79.0%", status: "reserved" },
  { id: "C2-4", area: "computer", x: "51.1%", y: "79.0%", status: "available" },

  /* Study Table 1 */
  { id: "S1-1", area: "study", x: "78.3%", y: "37.5%", status: "available" },
  { id: "S1-2", area: "study", x: "86.0%", y: "37.5%", status: "available" },
  { id: "S1-3", area: "study", x: "78.3%", y: "56.8%", status: "reserved" },
  { id: "S1-4", area: "study", x: "86.0%", y: "56.8%", status: "available" },
];

const tables = [
  { id: "T1", x: "19.2%", y: "45.5%", label: "Reading Table A", type: "round" },
  { id: "T2", x: "18.2%", y: "71.5%", label: "Reading Table B", type: "round" },
  { id: "T3", x: "32.0%", y: "45.5%", label: "Reading Table C", type: "round" },

  {
    id: "T4",
    x: "51.2%",
    y: "42.5%",
    label: "Computer Desk A",
    type: "computer4",
  },
  {
    id: "T5",
    x: "49.0%",
    y: "74.0%",
    label: "Computer Desk B",
    type: "computer3",
  },

  { id: "T6", x: "82.2%", y: "47.0%", label: "Study Table 1", type: "study" },
];

const getAreaLabel = (area) => {
  if (area === "reading") return "Reading Room";
  if (area === "computer") return "Computer Area";
  if (area === "study") return "Study Rooms Area";
  return area;
};

const getSuggestedUse = (area) => {
  if (area === "reading") return "Quiet individual study";
  if (area === "computer") return "Computer-based work";
  if (area === "study") return "Group / study room use";
  return "-";
};

const getSeatShapeClass = (area) => {
  if (area === "reading") return "seatShapeRounded";
  if (area === "computer") return "seatShapeComputer";
  if (area === "study") return "seatShapeStudy";
  return "";
};

export default function RoomMap({
  selectedSeatId = null,
  onSeatSelect = () => {},
  showSelectionInfo = true,
}) {
  const selectedSeat =
    seatData.find((seat) => seat.id === selectedSeatId) || null;

  const handleSeatClick = (seat) => {
    if (seat.status === "reserved") return;
    onSeatSelect(seat);
  };

  return (
    <div className="roomMap">
      <div className="mapHeroHeader">
        <h2>Study Rooms Map</h2>
      </div>

      <div className="interactiveLibraryMap">
        <div className="mapZone readingZone">
          <div className="zoneHeader">
            <span className="zoneTitle">Reading Room</span>
            <span className="zoneSubtitle">Quiet reading area</span>
          </div>

          <div className="mapShelves mapShelvesBack readingBackShelf" />
          <div className="mapShelves mapShelvesLeft">
            <span>Bookshelves</span>
          </div>
          <div className="mapShelves mapShelvesBottomLeft" />
          <div className="quietRoomWall" />
        </div>

        <div className="mapZone computerZone">
          <div className="zoneHeader">
            <span className="zoneTitle">Computer Area</span>
            <span className="zoneSubtitle">Public workstations</span>
          </div>

          <div className="mapShelves mapShelvesBack computerBackShelf" />
        </div>

        <div className="mapZone studyZone">
          <div className="zoneHeader">
            <span className="zoneTitle">Study Rooms Area</span>
            <span className="zoneSubtitle">Group and individual study</span>
          </div>

          <div className="mapShelves mapShelvesBack studyBackShelf" />
          <div className="mapShelves mapShelvesTop">
            <span>Reference Shelf</span>
          </div>

          <div className="mapReception">
            <span>Reception</span>
          </div>

          <div className="mapPrinter printerOne">
            <span>Printer 1</span>
          </div>

          <div className="mapPrinter printerTwo">
            <span>Printer 2</span>
          </div>

          <div className="mapPrinter printerThree">
            <span>Printer 3</span>
          </div>
        </div>

        <div className="bookshelfDivider dividerA" />
        <div className="bookshelfDivider dividerB" />
        <div className="mapShelves bottomDividerShelf" />
        <div className="mapShelves bottomFrontShelf" />

        <div className="mapWalkway">
          <span>Main Walkway</span>
        </div>

        <div className="mapEntrance">
          <span>Entrance</span>
        </div>

        <div className="loungeGroup loungeGroupLeft">
          <div className="loungeTableCenter" />
          <div className="loungeArmchair chairA" />
          <div className="loungeArmchair chairB" />
          <div className="loungeArmchair chairC" />
          <div className="loungePlant" />
        </div>

        <div className="loungeGroup loungeGroupRight">
          <div className="loungeTableCenter" />
          <div className="loungeArmchair chairA" />
          <div className="loungeArmchair chairB" />
          <div className="loungeArmchair chairC" />
        </div>

        {tables.map((table) => (
          <div
            key={table.id}
            className={`mapTable ${
              table.type === "round"
                ? "mapTableRound"
                : table.type === "computer4"
                  ? "mapTableComputer4"
                  : table.type === "computer3"
                    ? "mapTableComputer3"
                    : "mapTableStudy"
            }`}
            style={{ left: table.x, top: table.y }}
            title={table.label}
          >
            {table.type === "computer4" && (
              <>
                <div className="computerScreen s1">
                  <div className="computerScreenInner" />
                </div>
                <div className="computerScreen s2">
                  <div className="computerScreenInner" />
                </div>
                <div className="computerScreen s3">
                  <div className="computerScreenInner" />
                </div>
                <div className="computerScreen s4">
                  <div className="computerScreenInner" />
                </div>

                <div className="keyboard k1" />
                <div className="keyboard k2" />
                <div className="keyboard k3" />
                <div className="keyboard k4" />
              </>
            )}

            {table.type === "computer3" && (
              <>
                <div className="computerScreen s1">
                  <div className="computerScreenInner" />
                </div>
                <div className="computerScreen s2">
                  <div className="computerScreenInner" />
                </div>
                <div className="computerScreen s3">
                  <div className="computerScreenInner" />
                </div>

                <div className="keyboard k1" />
                <div className="keyboard k2" />
                <div className="keyboard k3" />
              </>
            )}

            {table.type === "study" && (
              <>
                <div className="studyChair chairTopLeft" />
                <div className="studyChair chairTopRight" />
                <div className="studyChair chairBottomLeft" />
                <div className="studyChair chairBottomRight" />
                <div className="studyNotebook studyNotebookLeft" />
                <div className="studyNotebook studyNotebookCenter" />
                <div className="studyNotebook studyNotebookRight" />
              </>
            )}

            {table.type === "round" && <div className="tableLamp" />}

            <span className="mapTableLabel">{table.label}</span>
          </div>
        ))}

        {seatData.map((seat) => {
          const isSelected = selectedSeatId === seat.id;

          return (
            <button
              key={seat.id}
              type="button"
              className={`seatMarker ${getSeatShapeClass(seat.area)} seat-${seat.status} ${
                isSelected ? "seat-selected" : ""
              }`}
              style={{ left: seat.x, top: seat.y }}
              onClick={() => handleSeatClick(seat)}
              title={`${seat.id} - ${seat.status}`}
              disabled={seat.status === "reserved"}
              aria-label={`Seat ${seat.id}`}
            >
              <span className="seatBack" />
              <span className="seatBase" />
            </button>
          );
        })}
      </div>

      <div className="roomLegend">
        <div className="legendItem">
          <span className="legendColor available"></span>
          <span>Available Seat</span>
        </div>

        <div className="legendItem">
          <span className="legendColor reserved"></span>
          <span>Reserved Seat</span>
        </div>

        <div className="legendItem">
          <span className="legendColor selected"></span>
          <span>Selected Seat</span>
        </div>

        <div className="legendItem">
          <span className="legendTable"></span>
          <span>Table</span>
        </div>

        <div className="legendItem">
          <span className="legendWalkway"></span>
          <span>Walkway</span>
        </div>

        <div className="legendItem">
          <span className="legendShelf"></span>
          <span>Bookshelf</span>
        </div>
      </div>

      {showSelectionInfo && (
        <div className="seatSelectionInfo">
          {selectedSeat ? (
            <>
              <h3>Selected Seat: {selectedSeat.id}</h3>
              <p>
                <strong>Seat ID:</strong> {selectedSeat.id}
              </p>
              <p>
                <strong>Area:</strong> {getAreaLabel(selectedSeat.area)}
              </p>
              <p>
                <strong>Status:</strong> {selectedSeat.status}
              </p>
              <p>
                <strong>Suggested Use:</strong>{" "}
                {getSuggestedUse(selectedSeat.area)}
              </p>
            </>
          ) : (
            <>
              <h3>No Seat Selected</h3>
              <p>Please choose an available seat from the map.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
